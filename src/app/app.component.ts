import { Component, OnInit, Optional } from '@angular/core';
import { environment } from 'src/environments/environment';
import { PushNotifications } from '@capacitor/push-notifications';
import { Device } from '@capacitor/device';
import { AlertController, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  public appPages = [
    { title: 'Search Places', url: '/landing', icon: 'map' },
  ];
  public labels = [];
  public appVersion = environment.appVersion;
  public email = 'appseedbed@gmail.com';
  constructor(
    private platform: Platform,
    private alertController: AlertController
  ) {
    this.platform.backButton.subscribeWithPriority(0, () => {
        this.presentAlert();
   });
  }
  ngOnInit(){
    this.registerNotifications();
    this.logDeviceInfo();
  }

  logDeviceInfo = async () => {
    const info = await Device.getInfo();
    const id = await Device.getId();
    localStorage.setItem('DeviceInfo', JSON.stringify(info));
    localStorage.setItem('DeviceId', id.identifier);
  };

  addListeners = async () => {
    await PushNotifications.addListener('registration', token => {
      console.log('Registration token: ', token.value);
    });
  
    await PushNotifications.addListener('registrationError', err => {
      console.log('Registration error: ', err.error);
    });
  
    await PushNotifications.addListener('pushNotificationReceived', notification => {
      console.log('Push notification received: ', notification);
    });
  
    await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
      console.log('Push notification action performed', notification.actionId, notification.inputValue);
    });
  }
  
  registerNotifications = async () => {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      throw new Error('User denied permissions!');
    }

    await PushNotifications.register();
    this.addListeners();
  }
  async presentAlert() {
    const alert = await this.alertController.create({
      header: 'Alert',
      message: 'Do you want to close this app?',
      buttons:  [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
           
          },
        },
        {
          text: 'OK',
          role: 'confirm',
          handler: () => {
            App.exitApp();
          },
        },
      ],
    });

    await alert.present();
  }
}
