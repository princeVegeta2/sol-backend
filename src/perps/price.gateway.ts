import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Server } from 'socket.io';
  import { PerpService } from './perps.service';
  
  @WebSocketGateway({
    cors: true, // or configure as you need
  })
  export class PriceGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
  {
    @WebSocketServer()
    server: Server;
  
    private intervalId: NodeJS.Timeout;
  
    constructor(private readonly perpService: PerpService) {}
  
    afterInit() {
      console.log('PriceGateway initialized');
  
      // e.g. broadcast the price every 3 seconds
      this.intervalId = setInterval(() => {
        const currentPrice = this.perpService.getCurrentSolPrice();
        this.server.emit('priceUpdate', { solPrice: currentPrice });
      }, 3000);
    }
  
    handleConnection(client: any) {
      console.log('New client connected:', client.id);
      // Send immediate price
      const currentPrice = this.perpService.getCurrentSolPrice();
      client.emit('priceUpdate', { solPrice: currentPrice });
    }
  
    handleDisconnect(client: any) {
      console.log('Client disconnected:', client.id);
    }
  
    beforeApplicationShutdown() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
    }
  }
  