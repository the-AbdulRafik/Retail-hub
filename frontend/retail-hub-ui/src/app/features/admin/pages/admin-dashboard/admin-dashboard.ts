
import { CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CurrencyPipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard {
  protected readonly isDemoData = true;

  protected readonly stats = [
    {
      label: 'Total Orders',
      value: '1,284',
      change: '+12.5%',
      icon: 'ORD',
      tone: 'orange',
    },
    {
      label: 'Total Revenue',
      value: 'INR 4,82,500',
      change: '+8.2%',
      icon: 'REV',
      tone: 'green',
    },
    {
      label: 'Pending Orders',
      value: '36',
      change: 'Needs attention',
      icon: 'PEN',
      tone: 'blue',
    },
    {
      label: 'Low Stock Items',
      value: '12',
      change: 'Restock required',
      icon: 'STK',
      tone: 'red',
    },
  ];

  protected readonly recentOrders = [
    { orderNumber: 'ORD-1024', customer: 'Arun Kumar', date: '27 Nov 2026', amount: 2450, status: 'Delivered' },
    { orderNumber: 'ORD-1023', customer: 'Priya Sharma', date: '27 Nov 2026', amount: 1890, status: 'Pending' },
    { orderNumber: 'ORD-1022', customer: 'Rahul Das', date: '26 Nov 2026', amount: 3200, status: 'Confirmed' },
    { orderNumber: 'ORD-1021', customer: 'Meena Devi', date: '26 Nov 2026', amount: 950, status: 'Preparing' },
    { orderNumber: 'ORD-1020', customer: 'Karthik Raj', date: '25 Nov 2026', amount: 1750, status: 'Cancelled' },
  ];

  protected readonly lowStockProducts = [
    { name: 'Basmati Rice', category: 'Grains', stock: 5, reorderLevel: 20 },
    { name: 'Sunflower Oil', category: 'Oil', stock: 8, reorderLevel: 25 },
    { name: 'Chocolate Cookies', category: 'Snacks', stock: 3, reorderLevel: 15 },
    { name: 'Wheat Flour', category: 'Grains', stock: 10, reorderLevel: 30 },
  ];
}
