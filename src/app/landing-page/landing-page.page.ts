import { Component, ElementRef, Inject, OnDestroy, OnInit } from '@angular/core';
import { GeneralService } from '../service/general.service';
import { Subscription } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import * as data from '../utils/nearbyData.json' 
import { mapData } from '../model/mapData.model';
import { Geolocation, GeolocationPluginPermissions } from '@capacitor/geolocation';
import { Browser } from '@capacitor/browser';
import { FirebaseAnalytics } from "@capacitor-community/firebase-analytics";
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, BannerAdPluginEvents, AdMobBannerSize, AdOptions, AdLoadInfo, InterstitialAdPluginEvents, RewardAdPluginEvents, AdMobRewardItem, RewardAdOptions } from '@capacitor-community/admob';
import {  ToastController } from '@ionic/angular';
import { Diagnostic } from '@awesome-cordova-plugins/diagnostic/ngx';
import { Capacitor } from '@capacitor/core';
import { LocationAccuracy } from '@awesome-cordova-plugins/location-accuracy/ngx';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { Keyboard } from '@capacitor/keyboard';


@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.page.html',
  styleUrls: ['./landing-page.page.scss'],
})

export class LandingPagePage implements OnInit, OnDestroy {
  private authoriser = '';
  private mapDataSubscription!: Subscription;
  private apiScriptLoaded = false;
  private window: any;
  public results!: mapData[];
  public searchTerm : string | null = '' ;
  searched = false;
  showLoader = false;
  private elementRef!: ElementRef;
  deviceInfo:any
  deviceId:any

  constructor(
    private service: GeneralService,
    @Inject(DOCUMENT) private document: Document,
    private toastController: ToastController,
    private diagnostic: Diagnostic,
    private locationAccuracy: LocationAccuracy,
    private androidPermissions: AndroidPermissions
  ) {
    this.window = this.document.defaultView ;
  }

  ngOnInit() {
    this.initialize().then(() => {
      this.banner();
    });    
    const info = localStorage.getItem('DeviceInfo') || '';
    this.deviceInfo = JSON.parse(info);
    this.deviceId = localStorage.getItem('DeviceId')?.toString();
    FirebaseAnalytics.setCollectionEnabled({
      enabled: true,
    });
    FirebaseAnalytics.setUserId({
      userId: this.deviceId,
    });
    FirebaseAnalytics.setScreenName({
      screenName: "Search",
      nameOverride: "LandingPage",
    });
    this.authoriser =  this.service.getAuthorization();
    const script = this.service.loadMapScript();
    script.onload = () => {
      console.log('Google API Script loaded');
      this.apiScriptLoaded = true;
    }
    script.onerror = () => {
      console.log('Could not load the Google API Script!');
      this.apiScriptLoaded = false;
    }
  }

  

  searchplaces(searchTerm:any|null){
    // this.initMap();
    const searchkey = searchTerm.trim();
    if(searchkey.length){
      Keyboard.hide();
      if(Capacitor.isNativePlatform()){
        this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION).then(
          result => {
            if(result.hasPermission){
               this.doSearch(searchkey);
            }else {
              this.androidPermissions.requestPermissions([this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION, this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION]).then(() => {
                this.doSearch(searchkey);
              });
            }
          },
          err => {
            this.androidPermissions.requestPermissions([this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION, this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION]).then(() => {
              this.doSearch(searchkey);
            });
          }
        ).catch(()=> {
          this.presentToast('bottom', 'Please enable location');
        });  
      } else {
        this.doSearch(searchkey);
      }
    }
  }

 

  doSearch(searchkey: string){
    if(Capacitor.isNativePlatform()){
      this.diagnostic.isLocationEnabled().then((enabled) => {
        if (enabled === true){
          Geolocation.getCurrentPosition().then((geoData) => {
            this.showLoader = true;
            const lat = geoData.coords.latitude;
            const long = geoData.coords.longitude;
            this.initMap(lat,long,searchkey);
            // For development purpose to avoid real call to map API
            // setTimeout(() => {
            //   this.showLoader = false;
            //   this.searched = true;
            //   const importedData = {...data}
            //   this.showData(importedData.results);
            // }, 1000);
          }).catch((e) => {
            this.presentToast('bottom', 'Please allow location permission to search');
          })
        } else {
          this.presentToast('bottom', 'Location not enabled');
          this.locationAccuracy.canRequest().then((canRequest: boolean) => {
            if(canRequest) {
              // the accuracy option will be ignored by iOS
              this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
                (res) => {
                  this.presentToast('bottom', 'Location enabled')
                  Geolocation.getCurrentPosition().then((geoData) => {
                    this.showLoader = true;
                    const lat = geoData.coords.latitude;
                    const long = geoData.coords.longitude;
                    this.initMap(lat,long,searchkey);
                    // For development purpose to avoid real call to map API
                    // setTimeout(() => {
                    //   this.showLoader = false;
                    //   this.searched = true;
                    //   const importedData = {...data}
                    //   this.showData(importedData.results);
                    // }, 1000);
                  }).catch((e) => {
                    this.presentToast('bottom', 'Please enable location');
                  })
                },
                error => this.presentToast('bottom', 'Please enable location')
              );
            }          
          });
        }
      }).catch(e => this.presentToast('bottom', 'Please enable location'));
    }
    else {
      Geolocation.getCurrentPosition().then((geoData) => {
        this.showLoader = true;
        // const lat = geoData.coords.latitude;
        // const long = geoData.coords.longitude;
        // this.initMap(lat,long,searchkey);
        // For development purpose to avoid real call to map API
        setTimeout(() => {
          this.showLoader = false;
          this.searched = true;
          const importedData = {...data}
          this.showData(importedData.results);
        }, 1000);
      }).catch((e) => {
        console.log(e)
      })
    }
    
    
  }

  initMap(lat:any, long:any, searchterm: string) {
    const location = new this.window.google.maps.LatLng(lat,long);
  
    const map = new this.window.google.maps.Map(document.getElementById('map'), {
        center: location,
        zoom: 15
      });
  
    const request = {
      location,
      keyword: searchterm,
      rankBy: this.window.google.maps.places.RankBy.DISTANCE
    };

    FirebaseAnalytics.setCollectionEnabled({
      enabled: true,
    });

    FirebaseAnalytics.logEvent({
      name: "User searched",
      params: {
        device_id: this.deviceId,
        lat: lat,
        lng: long,
        search_term: searchterm,
      },
    });
    FirebaseAnalytics.setUserProperty({
      name: "device_id",
      value: this.deviceId,
    });    
    FirebaseAnalytics.setUserProperty({
      name: "lat",
      value: lat,
    }); 
    FirebaseAnalytics.setUserProperty({
      name: "lng",
      value: long,
    });   
    FirebaseAnalytics.setUserProperty({
      name: "searchTerm",
      value: searchterm,
    });  
  
    const service = new this.window.google.maps.places.PlacesService(map);
    service.nearbySearch(request, (results:any, status:any) => {
      this.showLoader = false;
      this.searched = true;
      const count = localStorage.getItem('searchCount');
      if(count?.length){
        if(+count % 10 == 0){
          this.rewardVideo();
        } else {
          if(+count % 5 == 0){
            this.interstitial();
          }
        }
        let updatedCount = +count + 1;
        localStorage.setItem('searchCount', updatedCount.toString());
      } else {
        localStorage.setItem('searchCount', '1');
      }
      if(status === this.window.google.maps.places.PlacesServiceStatus.OK){     
        this.showData(results);
      }
    });
  }

  showData(results:any){
    var el = document.querySelector('.input-clear-icon');
    if(el) {
      el.addEventListener('click', this.onClearInput.bind(this));
    }
    this.results = results;
  }

  handleRefresh(event:any) {
    setTimeout(() => {
      if(!this.apiScriptLoaded){
        const script = this.service.loadMapScript();
        script.onload = () => {
          console.log('Google API Script loaded');
          this.apiScriptLoaded = true;
        }
        script.onerror = () => {
          console.log('Could not load the Google API Script!');
          this.apiScriptLoaded = false;
        }
      }
      event.target.complete();
    }, 2000);
  }

  navigateToLocation(geometryData:any){
    FirebaseAnalytics.setCollectionEnabled({
      enabled: true,
    });
    FirebaseAnalytics.logEvent({
      name: "User Navigated",
      params: {
        device_id: this.deviceId,
        lat: geometryData.geometry.location.lat(),
        lng: geometryData.geometry.location.lng(),
        search_term: this.searchTerm,
      },
    });
    if(geometryData.geometry.location.lat() && geometryData.geometry.location.lng()){
      Browser.open({ url: `https://www.google.com/maps/search/?api=1&query=${geometryData.geometry.location.lat()},${geometryData.geometry.location.lng()}` })
    }
  }

  onClearInput(){
    this.searched = false;
    this.showLoader = false;
  }

  async initialize(): Promise<void> {
    const { status } = await AdMob.trackingAuthorizationStatus();
  
    if (status === 'notDetermined') {
      /**
       * If you want to explain TrackingAuthorization before showing the iOS dialog,
       * you can show the modal here.
       * ex)
       * const modal = await this.modalCtrl.create({
       *   component: RequestTrackingPage,
       * });
       * await modal.present();
       * await modal.onDidDismiss();  // Wait for close modal
       **/
    }
   
    AdMob.initialize({
      requestTrackingAuthorization: true,
      testingDevices: [''],
    });
  }

  async banner(): Promise<void> {
    AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
      // Subscribe Banner Event Listener
    });

    AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size: AdMobBannerSize) => {
      // Subscribe Change Banner Size
    });

    const options: BannerAdOptions = {
      adId: 'ca-app-pub-7602154750776755/4182308386',
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      // isTesting: true
      // npa: true
    };
    AdMob.showBanner(options);
  }

  async interstitial(): Promise<void> {
    AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info: AdLoadInfo) => {
      // Subscribe prepared interstitial
    });
  
    const options: AdOptions = {
      adId: 'ca-app-pub-7602154750776755/6845018797',
      // isTesting: true
      // npa: true
    };
    await AdMob.prepareInterstitial(options);
    await AdMob.showInterstitial();
  }

  async rewardVideo(): Promise<void> {
    AdMob.addListener(RewardAdPluginEvents.Loaded, (info: AdLoadInfo) => {
      // Subscribe prepared rewardVideo
    });
  
    AdMob.addListener(RewardAdPluginEvents.Rewarded, (rewardItem: AdMobRewardItem) => {
      // Subscribe user rewarded
      console.log(rewardItem);
    });
  
    const options: RewardAdOptions = {
      adId: 'ca-app-pub-7602154750776755/7052014300',
      // isTesting: true
      // npa: true
      // ssv: {
      //   userId: "A user ID to send to your SSV"
      //   customData: JSON.stringify({ ...MyCustomData })
      //}
    };
    await AdMob.prepareRewardVideoAd(options);
    const rewardItem = await AdMob.showRewardVideoAd();
  }
  async presentToast(position: 'top' | 'middle' | 'bottom', message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 1500,
      position: position,
      cssClass: 'custom-toast'
    });

    await toast.present();
  }
  ngOnDestroy(){
    this.mapDataSubscription.unsubscribe();
  }

}
