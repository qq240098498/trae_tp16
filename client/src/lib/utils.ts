import type { OrderStatus, ReturnStatus } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  pending_payment: { label: '待付款', color: 'text-orange-500 bg-orange-50' },
  paid: { label: '待发货', color: 'text-blue-500 bg-blue-50' },
  shipped: { label: '运输中', color: 'text-cyan-500 bg-cyan-50' },
  delivered: { label: '待验货', color: 'text-purple-500 bg-purple-50' },
  inspecting: { label: '验货中', color: 'text-purple-500 bg-purple-50' },
  inspection_passed: { label: '验货通过', color: 'text-green-500 bg-green-50' },
  inspection_failed: { label: '验货失败', color: 'text-red-500 bg-red-50' },
  completed: { label: '已完成', color: 'text-gray-600 bg-gray-100' },
  cancelled: { label: '已取消', color: 'text-gray-500 bg-gray-100' },
  return_requested: { label: '退货申请中', color: 'text-yellow-600 bg-yellow-50' },
  returned: { label: '已退货', color: 'text-gray-500 bg-gray-100' },
};

export const RETURN_STATUS_MAP: Record<ReturnStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'text-orange-500 bg-orange-50' },
  approved: { label: '已同意', color: 'text-green-500 bg-green-50' },
  rejected: { label: '已拒绝', color: 'text-red-500 bg-red-50' },
  shipped_back: { label: '退货中', color: 'text-cyan-500 bg-cyan-50' },
  delivered_back: { label: '待退款', color: 'text-purple-500 bg-purple-50' },
  refunded: { label: '已退款', color: 'text-gray-600 bg-gray-100' },
  closed: { label: '已关闭', color: 'text-gray-500 bg-gray-100' },
};

export function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}
