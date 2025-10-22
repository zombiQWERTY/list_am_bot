# 📈 План масштабирования: 100 пользователей, 300 подписок

## 🔴 Текущие узкие места

### 1. **Sequential Processing** (КРИТИЧНО!)

```typescript
// src/application/scheduler/scrape-queue.service.ts
private async processQueue(): Promise<void> {
  while (true) {
    if (this.isProcessing || this.queue.length === 0) {
      continue; // ❌ Только ОДИН воркер за раз!
    }
    this.isProcessing = true;
    await task.taskFn(); // ❌ Блокирует всю очередь
  }
}
```

**Проблема:**

- 300 подписок × 60-90 секунд = **5-7.5 часов** на цикл
- Cron запускается каждый час → накопление задач в очереди
- `/last` команды ждут окончания всего cron цикла

**Решение:** Параллельная обработка с ограниченным пулом воркеров

---

### 2. **Single Browser Instance** (КРИТИЧНО!)

```typescript
// src/infrastructure/scraper/browser/browser.service.ts
private browserInstance: BrowserInstance | null = null;

private async getBrowserInstance(proxy: ProxyDescriptor): Promise<BrowserInstance> {
  if (this.browserInstance) {
    return this.browserInstance; // ❌ Переиспользуется для всех запросов
  }
}
```

**Проблема:**

- Один browser для всех запросов (не concurrent-safe)
- Browser не может использоваться параллельно
- Overhead на создание/закрытие browser (5-10 секунд)

**Решение:** Пул browser instances

---

### 3. **Proxy Limitations**

```typescript
// servers.json - судя по логам, только 1 прокси
['e0a9a65f28a201175e11__cr.ge,am:5e570917c47db9a0@gw.dataimpulse.com:823'];
```

**Проблема:**

- Все запросы через один IP
- Rate limiting от list.am
- Cloudflare может заблокировать IP

**Решение:** Множество прокси для ротации

---

### 4. **Database N+1 Problem**

```typescript
// src/application/scheduler/scrape-worker.service.ts
for (const user of activeUsers) {
  const subscriptions = await this.subscriptionService.findActiveByUserId(
    user.id,
  );
  // ❌ N запросов к БД (1 на каждого пользователя)

  for (const subscription of subscriptions) {
    // ❌ Ещё запросы для каждой подписки
  }
}
```

**Проблема:**

- 100 пользователей → 100 DB queries для subscriptions
- Ещё запросы для seen listings
- Latency накапливается

**Решение:** Batch queries, eager loading

---

### 5. **Cloudflare Challenge** (ВЫСОКИЙ ПРИОРИТЕТ!)

```
⚠️  Cloudflare challenge detected!
❌ Challenge not resolved
❌ Navigation wait also failed
```

**Проблема:**

- ~50-70% запросов падают из-за Cloudflare
- Retry × 3 = утроение времени на неудачные запросы
- Перегрузка прокси и браузера

---

## 🎯 План оптимизации

### Фаза 1: Параллелизация (СРОЧНО!)

#### 1.1 Пул воркеров для очереди

```typescript
// src/application/scheduler/scrape-queue.service.ts
export class ScrapeQueueService {
  private readonly MAX_CONCURRENT_WORKERS = 5; // Начнём с 5 параллельных
  private activeWorkers = 0;

  private async processQueue(): Promise<void> {
    while (true) {
      await delay(100);

      // Запускаем несколько воркеров параллельно
      while (
        this.activeWorkers < this.MAX_CONCURRENT_WORKERS &&
        this.queue.length > 0
      ) {
        const task = this.queue.shift();
        if (!task) break;

        this.activeWorkers++;

        // Запускаем без await (параллельно)
        this.executeTask(task).finally(() => {
          this.activeWorkers--;
        });
      }
    }
  }

  private async executeTask(task: ScrapeTask): Promise<void> {
    try {
      await task.taskFn();
    } catch (error) {
      this.logger.error(`Task failed: ${task.id}`, error);
    }
  }
}
```

**Результат:**

- 300 подписок / 5 воркеров = 60 подписок на воркер
- 60 × 60 секунд = **60 минут** (вместо 5+ часов!)
- Укладываемся в 1 час для cron

---

#### 1.2 Пул Browser Instances

```typescript
// src/infrastructure/scraper/browser/browser-pool.service.ts
@Injectable()
export class BrowserPoolService {
  private readonly POOL_SIZE = 5;
  private pool: BrowserInstance[] = [];
  private availableBrowsers: BrowserInstance[] = [];

  async initialize(): Promise<void> {
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const browser = await this.createBrowserInstance();
      this.pool.push(browser);
      this.availableBrowsers.push(browser);
    }
  }

  async acquireBrowser(): Promise<BrowserInstance> {
    while (this.availableBrowsers.length === 0) {
      await delay(500); // Ждём освобождения
    }
    return this.availableBrowsers.pop()!;
  }

  releaseBrowser(browser: BrowserInstance): void {
    this.availableBrowsers.push(browser);
  }
}
```

**Результат:**

- 5 browser instances работают параллельно
- Переиспользование (нет overhead на запуск)
- Изоляция между задачами

---

### Фаза 2: База данных

#### 2.1 Batch Loading

```typescript
// src/application/scheduler/scrape-worker.service.ts
private async executeCycle(): Promise<void> {
  // ❌ Было:
  // for (const user of activeUsers) {
  //   const subscriptions = await this.subscriptionService.findActiveByUserId(user.id);
  // }

  // ✅ Стало:
  const activeUsers = await this.userService.findAllActiveWithSubscriptions();
  // ^ Один запрос с JOIN вместо N запросов

  for (const user of activeUsers) {
    // subscriptions уже загружены!
    for (const subscription of user.subscriptions) {
      // ...
    }
  }
}
```

#### 2.2 Batch Insert для Seen Listings

```typescript
// Вместо:
for (const listing of listings) {
  await this.seenListingRepository.save({ ... });
}

// Делаем:
await this.seenListingRepository.insert(
  listings.map(listing => ({ ... }))
);
```

---

### Фаза 3: Proxy Management

#### 3.1 Добавить больше прокси

```json
// servers.json
[
  "proxy1__cr.ge,am:password1@gw.dataimpulse.com:823",
  "proxy2__cr.ge,am:password2@gw.dataimpulse.com:823",
  "proxy3__cr.ge,am:password3@gw.dataimpulse.com:823",
  "proxy4__cr.ge,am:password4@gw.dataimpulse.com:823",
  "proxy5__cr.ge,am:password5@gw.dataimpulse.com:823"
]
```

**Минимум:** 5 прокси (по одному на воркер)
**Оптимально:** 10-20 прокси для ротации

#### 3.2 Intelligent Rotation

```typescript
// Не ждать 15 минут sticky session при ошибках Cloudflare
if (errorType === ErrorType.CLOUDFLARE_CHALLENGE) {
  // Немедленно переключиться на другой прокси
  await this.proxyManager.rotateNow(sessionId);
}
```

---

### Фаза 4: Cloudflare Mitigation

#### 4.1 Session Reuse

```typescript
// Сохранять успешные cookies/localStorage между запросами
// Использовать те же сессии для похожих query
const sessionKey = getRegionKey(query); // "car-listing-ge-am"
await this.sessionService.loadSession(page, sessionKey);
```

#### 4.2 Backoff Strategy

```typescript
// При частых Cloudflare challenges - снизить нагрузку
if (cloudflareFailureRate > 0.5) {
  this.requestDelayMs *= 2; // Увеличить задержки
  this.MAX_CONCURRENT_WORKERS = Math.max(1, this.MAX_CONCURRENT_WORKERS - 1);
}
```

---

## 📊 Ожидаемые результаты

### До оптимизации:

```
300 подписок × 60-90 секунд = 5-7.5 часов
1 воркер
1 browser
Cron не успевает
```

### После Фазы 1 (Параллелизация):

```
300 подписок / 5 воркеров = 60 подписок/воркер
60 × 60 секунд = ~60 минут
5 воркеров
5 browsers
✅ Укладываемся в 1 час!
```

### После Фазы 2 (DB):

```
~60 минут → ~50 минут
Экономия ~10 минут на DB queries
```

### После Фазы 3 (Proxy):

```
~50 минут → ~40 минут
Меньше Cloudflare challenges
Лучшая ротация IP
```

### После Фазы 4 (Cloudflare):

```
~40 минут → ~30 минут
Session reuse ускоряет навигацию
Меньше retry
```

---

## 🚀 Roadmap

### Немедленно (Сегодня):

1. ✅ Исправить query bug (`/last` через очередь) - DONE
2. 🔄 Реализовать параллельную очередь (5 воркеров)
3. 🔄 Создать browser pool (5 instances)

### Эта неделя:

4. Оптимизировать DB queries (batch loading)
5. Добавить 5-10 прокси в `servers.json`
6. Настроить мониторинг (Prometheus/Grafana metrics)

### Следующая неделя:

7. Session reuse для Cloudflare bypass
8. Adaptive concurrency (автоматическая подстройка воркеров)
9. Rate limiting per proxy (не перегружать один IP)

### Будущее:

10. Horizontal scaling (несколько инстансов бота)
11. Redis для shared queue между инстансами
12. CAPTCHA solving service (2Captcha/Anti-Captcha)

---

## 💰 Cost Estimation

### Residential Proxies:

- 1 прокси: ~$10-30/месяц (зависит от трафика)
- 10 прокси: ~$100-300/месяц
- Важно: больше прокси = меньше блокировок = больше эффективность

### Compute Resources:

- Текущий: 1 instance (вероятно, 1-2 GB RAM)
- Нужно: минимум 4 GB RAM для 5 параллельных browsers
- Рекомендация: 8 GB RAM для стабильности

### Total:

- Прокси: $100-300/месяц
- Compute: +$10-30/месяц (увеличение instance)
- **Total: ~$110-330/месяц**

---

## 📈 Metrics to Monitor

```typescript
// Важные метрики:
- queue_size: number          // Размер очереди
- active_workers: number       // Активных воркеров
- avg_scrape_time: number      // Среднее время на scrape
- cloudflare_failure_rate: %   // % неудачных Cloudflare
- proxy_health: Map<string, %> // Здоровье каждого прокси
- cycle_duration: number       // Длительность цикла
- successful_scrapes: number   // Успешных запросов
```

---

## ⚠️ Risks & Mitigation

### Risk 1: List.am может заблокировать

**Mitigation:**

- Rate limiting (не больше X запросов/минуту на IP)
- Respectful delays (2-5 секунд между запросами)
- Rotate proxies часто

### Risk 2: Cloudflare может ужесточить защиту

**Mitigation:**

- Fallback на manual CAPTCHA solving сервисы
- Session reuse для обхода повторных challenges
- Adaptive concurrency (снижаем нагрузку при проблемах)

### Risk 3: Увеличение расходов

**Mitigation:**

- Мониторинг costs
- Оптимизация использования прокси
- Возможность отключения части воркеров при низкой нагрузке

---

## 🎯 Success Criteria

1. ✅ Cron cycle завершается < 60 минут
2. ✅ `/last` команды отвечают < 2 минут
3. ✅ Cloudflare failure rate < 20%
4. ✅ Proxy failure rate < 10%
5. ✅ No queue overflow (queue_size < 50)
6. ✅ Memory usage < 6 GB
7. ✅ CPU usage < 80% average
