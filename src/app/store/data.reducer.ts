// product.reducer.ts
import { Data } from './data';
import { Action } from '@ngrx/store';
export const ADD_PRODUCT = 'ADD_PRODUCT';
export function dataReducer(state: Data[] = [{handshake:'123456$#@$^@1ERF'}], action:any) {
  switch (action.type) {
    case ADD_PRODUCT:
        return [...state, action.payload];
    default:
        return state;
    }
}