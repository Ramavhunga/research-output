import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly isLoading;
  protected readonly title = signal('research_out_front');

  constructor(private readonly loadingService: LoadingService) {
    this.isLoading = this.loadingService.isLoading;
  }
}
