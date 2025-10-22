import { TelegramUserId } from '@list-am-bot/common/types/listing.types';

export enum UserLanguage {
  RU = 'ru',
  EN = 'en',
}

export class UserEntity {
  id: number;
  telegramUserId: TelegramUserId;
  username: string | null;
  language: UserLanguage;
  isPaused: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: UserEntity) {
    Object.assign(this, data);
  }
}
