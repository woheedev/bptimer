import type { RecordAuthResponse, RecordModel } from 'pocketbase';
import type { User } from './db';

// PocketBase Authentication Models
export type UserRecordModel = RecordModel & User;
export type UserAuthRefresh = RecordAuthResponse<UserRecordModel>;
