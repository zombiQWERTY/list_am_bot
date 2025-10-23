import { Context as TelegrafContext, Scenes } from 'telegraf';

export interface BotContext extends TelegrafContext, Scenes.SceneContext {}

export interface SceneSession extends Scenes.SceneSession {
  subscriptionQuery?: string;
}
