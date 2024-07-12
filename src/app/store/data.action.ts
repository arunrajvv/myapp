import { Action } from '@ngrx/store';
import { Data } from './data';
export enum DataActionType {
  GET_DATA = '[DATA] Get Data',
}
export class GetDataction implements Action {
  readonly type = DataActionType.GET_DATA;
  //add an optional payload
  constructor(public payload: Data) {}
}
export type DataAction = GetDataction;