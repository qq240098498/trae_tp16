import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Truck, Package, CheckCircle, Shield, User } from 'lucide-react';
import { api } from '@/lib/api';
import { toast, Modal, Button } from '@/components/UI';
import { useAuthStore } from '@/store/useAuthStore';
import { RETURN_STATUS_MAP, formatDate } from '@/lib/utils';
import type { ReturnRecord } from '@/types';

export default function ReturnDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [returnRecord, setReturnRecord] = useState<ReturnRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [showShipBack, setShowShipBack] = useState(false);
  const [returnTracking, setReturnTracking] = useState('');
  const [returnCourier, setReturnCourier] = useState('顺丰速运');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadReturn();
  }, [id, token]);

  const loadReturn = async () => {
    setLoading(true);
    try {
      const data = await api.getReturn(Number(id));
      setReturnRecord(data);
    } catch (e: any) {
      toast(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const reload = () => loadReturn();

  if (loading || !returnRecord || !returnRecord.order) {
    return <div className="max-w-3xl mx-auto px-4 py-10 text-center text-gray-400">加载中...</div>;
  }

  const isBuyer = returnRecord.order && user && 'buyerId' in returnRecord.order
    ? returnRecord.order.buyerId === user.id
    : false;
  const isSeller = returnRecord.order && user && 'sellerId' in returnRecord.order
    ? returnRecord.order.sellerId === user.id
    : false;
  const status = RETURN_STATUS_MAP[returnRecord.status];

  const steps = [
    { key: 'pending', label: '申请退货', icon: Package, desc: '等待卖家处理' },
    { key: 'approved', label: '卖家同意', icon: CheckCircle, desc: '请寄回商品' },
    { key: 'shipped_back', label: '已寄出', icon: Truck, desc: '等待卖家签收' },
    { key: 'delivered_back', label: '卖家已签收', icon: Package, desc: '等待退款' },
    { key: 'refunded', label: '已退款', icon: Shield, desc: '退款完成' },
  ];

  const currentIdx = Math.max(0, steps.findIndex(s => s.key === returnRecord.status));

  const handleAction = async (fn: () => Promise<any>, successMsg: string) => {
    setActionLoading(true);
    try {
      await fn();
      toast(successMsg, 'success');
      await reload();
    } catch (e: any) {
      toast(e.message || '操作失败', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-28 sm:pb-8">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100 -mx-4 px-4 py-3 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">退货详情</h1>
        </div>
      </div>

      <div className={`rounded-2xl p-5 mb-4 ${status.color.replace('text-', 'bg-').replace('bg-green-', 'bg-gradient-to-br from-green-').replace('bg-orange-', 'bg-gradient-to-br from-orange-').replace('bg-red-', 'bg-gradient-to-br from-red-').replace('bg-cyan-', 'bg-gradient-to-br from-cyan-').replace('bg-purple-', 'bg-gradient-to-br from-purple-').replace('bg-gray-', 'bg-gradient-to-br from-gray-')}`}>
        <p className="text-white/90 text-sm mb-1">退货状态</p>
        <p className="text-white text-xl font-bold">{status.label}</p>
        {returnRecord.status === 'pending' && (
          <p className="text-white/80 text-sm mt-2">等待卖家处理退货申请...</p>
        )}
        {returnRecord.status === 'approved' && isBuyer && (
          <p className="text-white/80 text-sm mt-2">卖家已同意，请尽快寄回商品</p>
        )}
        {returnRecord.status === 'rejected' && (
          <p className="text-white/80 text-sm mt-2">卖家拒绝原因：{returnRecord.sellerRemark}</p>
        )}
      </div>

      {returnRecord.status !== 'rejected' && returnRecord.status !== 'closed' && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
          <div className="flex items-start justify-between">
            {steps.map((step, i) => {
              const done = i < currentIdx || (i === currentIdx && returnRecord.status === 'refunded');
              const active = i === currentIdx;
              return (
                <div key={step.key} className="flex flex-col items-center relative flex-1">
                  {i < steps.length - 1 && (
                    <div className={`absolute top-3 left-1/2 w-full h-0.5 ${
                      i < currentIdx ? 'bg-green-400' : 'bg-gray-200'
                    }`} />
                  )}
                  <div className={`relative w-7 h-7 rounded-full flex items-center justify-center z-10 ${
                    done ? 'bg-green-500 text-white' : active ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    <step.icon size={14} />
                  </div>
                  <span className={`text-xs mt-1.5 font-medium ${done || active ? 'text-gray-700' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {returnRecord.product && (
        <Link
          to={`/product/${returnRecord.product.id}`}
          className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 flex gap-3"
        >
          <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
            <img src={returnRecord.product.images?.[0]} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 line-clamp-2 leading-snug">{returnRecord.product.title}</p>
            <p className="text-orange-500 font-bold mt-2">
              ¥{returnRecord.order?.price}
            </p>
          </div>
        </Link>
      )}

      <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 space-y-3 text-sm">
        <p className="font-medium text-gray-800 mb-2">退货信息</p>
        <div className="flex justify-between">
          <span className="text-gray-500">退货原因</span>
          <span className="text-gray-800">{returnRecord.reason || '-'}</span>
        </div>
        {returnRecord.description && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 flex-shrink-0">详细描述</span>
            <span className="text-gray-800 text-right">{returnRecord.description}</span>
          </div>
        )}
        {returnRecord.sellerRemark && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 flex-shrink-0">
              {returnRecord.status === 'rejected' ? '拒绝原因' : '卖家备注'}
            </span>
            <span className="text-gray-800 text-right">{returnRecord.sellerRemark}</span>
          </div>
        )}
        {returnRecord.returnTrackingNo && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 flex-shrink-0">退回物流</span>
            <span className="text-gray-800 text-right">
              {returnRecord.returnCourier} {returnRecord.returnTrackingNo}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">申请时间</span>
          <span className="text-gray-800">{formatDate(returnRecord.createdAt)}</span>
        </div>
        {returnRecord.approvedAt && (
          <div className="flex justify-between">
            <span className="text-gray-500">同意时间</span>
            <span className="text-gray-800">{formatDate(returnRecord.approvedAt)}</span>
          </div>
        )}
        {returnRecord.refundedAt && (
          <div className="flex justify-between">
            <span className="text-gray-500">退款时间</span>
            <span className="text-gray-800">{formatDate(returnRecord.refundedAt)}</span>
          </div>
        )}
      </div>

      {returnRecord.order && (
        <Link
          to={`/orders/${returnRecord.order.id}`}
          className="bg-white rounded-2xl p-4 border border-gray-100 mb-4 flex items-center justify-between text-sm"
        >
          <div className="flex items-center gap-2">
            <Package size={16} className="text-gray-400" />
            <span className="text-gray-600">关联订单</span>
            <span className="text-gray-800 font-medium">#{returnRecord.order.orderNo}</span>
          </div>
          <ArrowLeft className="text-gray-300 rotate-180" size={16} />
        </Link>
      )}

      <div className="fixed bottom-16 sm:bottom-4 left-0 right-0 sm:static px-4 sm:px-0 z-30">
        <div className="max-w-3xl mx-auto bg-white sm:bg-transparent border-t border-gray-100 sm:border-0 py-3 sm:py-0 flex gap-2 sm:justify-end">
          {returnRecord.status === 'pending' && isSeller && (
            <>
              <Button variant="secondary" onClick={() => setShowReject(true)}>
                拒绝退货
              </Button>
              <Button onClick={() => handleAction(() => api.approveReturn(returnRecord.id, {}), '已同意退货')}>
                同意退货
              </Button>
            </>
          )}
          {returnRecord.status === 'approved' && isBuyer && (
            <Button onClick={() => setShowShipBack(true)}>
              填写退回物流
            </Button>
          )}
          {returnRecord.status === 'shipped_back' && isSeller && (
            <Button onClick={() => handleAction(() => api.confirmReturnReceipt(returnRecord.id), '已确认收货')}>
              确认收到退货
            </Button>
          )}
          {returnRecord.status === 'delivered_back' && isSeller && (
            <Button onClick={() => handleAction(() => api.refundReturn(returnRecord.id), '退款成功')}>
              确认退款 ¥{returnRecord.order?.price}
            </Button>
          )}
        </div>
      </div>

      <Modal open={showReject} onClose={() => setShowReject(false)} title="拒绝退货">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">拒绝原因 *</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="请说明拒绝退货的原因..."
              className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowReject(false)}>取消</Button>
            <Button
              className="flex-1"
              variant="danger"
              disabled={!rejectReason.trim() || actionLoading}
              onClick={() => {
                if (!rejectReason.trim()) return;
                handleAction(
                  () => api.rejectReturn(returnRecord.id, { reason: rejectReason }),
                  '已拒绝退货'
                ).then(() => setShowReject(false));
              }}
            >
              {actionLoading ? '处理中...' : '确认拒绝'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showShipBack} onClose={() => setShowShipBack(false)} title="填写退回物流">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">物流公司</label>
            <input
              value={returnCourier}
              onChange={e => setReturnCourier(e.target.value)}
              placeholder="顺丰速运、圆通等"
              className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">快递单号</label>
            <input
              value={returnTracking}
              onChange={e => setReturnTracking(e.target.value)}
              placeholder="请输入快递单号"
              className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowShipBack(false)}>取消</Button>
            <Button
              className="flex-1"
              disabled={actionLoading}
              onClick={() => handleAction(
                () => api.shipBackReturn(returnRecord.id, { trackingNo: returnTracking, courier: returnCourier }),
                '已填写物流信息'
              ).then(() => setShowShipBack(false))}
            >
              {actionLoading ? '处理中...' : '确认提交'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
