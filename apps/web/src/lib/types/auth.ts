import type { User } from '$lib/schemas';
import type { RecordAuthResponse, RecordModel } from 'pocketbase';

// PocketBase Authentication Models
export type UserRecordModel = RecordModel & User;
export type UserAuthRefresh = RecordAuthResponse<UserRecordModel>;
