import { Injectable } from '@angular/core';
import { EncDecryptService } from './enc-decrypt.service';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http'

@Injectable({
  providedIn: 'root'
})
export class GeneralService {
  public storeSubscription!: Subscription;
  authoriserDec!: string;
  mapUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=-33.8670522%2C151.1957362&radius=1500&type=restaurant&keyword=cruise&key='
  constructor(
    private enc: EncDecryptService,
    private store: Store<AppState>,
    private http: HttpClient
  ) {}

  getAuthorization(){
    const authorisationApprover = '123456$#@$^@1ERF';
    const authoriserEnc = environment.apiKey;
    this.authoriserDec = this.enc.get(authorisationApprover, authoriserEnc)    
    return this.authoriserDec;
  }

  getData(){
    const url = this.mapUrl+this.getAuthorization();
    return this.http.get(url);
  }

  loadMapScript() {
    const authorizer = this.getAuthorization();
    console.log('preparing to load...')
    let node = document.createElement('script');
    node.src = `https://maps.googleapis.com/maps/api/js?key=${authorizer}&libraries=places`;
    node.type = 'text/javascript';
    node.async = true;
    node.defer = true;
    document.getElementsByTagName('head')[0].appendChild(node);
    return node;      
  }
}
