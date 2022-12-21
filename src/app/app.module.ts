import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MidiSystemService } from './midi-system.service';
import { MidiMapperService } from './midi-mapper.service';
import { MidiPlayerService } from './midi-player.service';
import { PerformanceService } from './performance.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    MidiSystemService,
    MidiMapperService,
    MidiPlayerService,
    PerformanceService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
