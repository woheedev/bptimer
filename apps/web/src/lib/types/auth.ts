import type { RecordAuthResponse, RecordModel } from 'pocketbase';
import type { User } from '$lib/schemas';

// PocketBase Authentication Models
export type UserRecordModel = RecordModel & User;
export type UserAuthRefresh = RecordAuthResponse<UserRecordModel>;
