import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, Truck, Package, CheckCircle, Shield, Clock,
  AlertCircle, MapPin, User, Phone, Home
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast, Modal, Button } from '@/components/UI';
import { useAuthStore } from '@/store/useAuthStore';
import { ORDER_STATUS_MAP, RETURN_STATUS_MAP, formatDate } from '@/lib/utils';
import type { Order } from '@/types';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showShip, setShowShip] = useState(false);
  const [trackingNo, setTrackingNo] = useState('');
  const [courier, setCourier] = useState('顺丰速运');

  const [showReturn, setShowReturn] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnDesc, setReturnDesc] = useState('');

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
    loadOrder();
  }, [id, token]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const data = await api.getOrder(Number(id));
      setOrder(data);
    } catch (e: any) {
      toast(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const reload = () => loadOrder();

  if (loading || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-gray-100 rounded-2xl" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  const isBuyer = order.buyerId === user?.id;
  const isSeller = order.sellerId === user?.id;
  const status = ORDER_STATUS_MAP[order.status];

  const steps = [
    { key: 'pending_payment', label: '下单', icon: Clock },
    { key: 'paid', label: '付款', icon: CheckCircle },
    { key: 'shipped', label: '发货', icon: Package },
    { key: 'delivered', label: '收货', icon: Truck },
    { key: 'inspection_passed', label: '验货', icon: Shield },
    { key: 'completed', label: '完成', icon: CheckCircle },
  ];

  const currentIdx = Math.max(0, steps.findIndex(s => s.key === order.status));

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
          <h1 className="font-semibold text-gray-900">订单详情</h1>
        </div>
      </div>

      <div className={`rounded-2xl p-5 mb-4 ${status.color.replace('text-', 'bg-').replace('bg-green-', 'bg-gradient-to-br from-green-').replace('bg-orange-', 'bg-gradient-to-br from-orange-').replace('bg-blue-', 'bg-gradient-to-br from-blue-').replace('bg-cyan-', 'bg-gradient-to-br from-cyan-').replace('bg-purple-', 'bg-gradient-to-br from-purple-').replace('bg-yellow-', 'bg-gradient-to-br from-yellow-').replace('bg-red-', 'bg-gradient-to-br from-red-').replace('bg-gray-', 'bg-gradient-to-br from-gray-')}`}>
        <p className="text-white/90 text-sm mb-1">订单状态</p>
        <p className="text-white text-xl font-bold">{status.label}</p>
        {order.status === 'shipped' && order.logistics && (
          <p className="text-white/80 text-sm mt-2">
            {order.logistics.currentLocation}
          </p>
        )}
      </div>

      {order.status !== 'cancelled' && order.status !== 'returned' && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
          <div className="flex items-center justify-between">
            {steps.map((step, i) => {
              const done = i < currentIdx || (i === currentIdx && order.status === 'completed');
              const active = i === currentIdx;
              return (
                <div key={step.key} className="flex flex-col items-center relative flex-1">
                  {i < steps.length - 1 && (
                    <div className={`absolute top-3 left-1/2 w-full h-0.5 ${
                      i < currentIdx ? 'bg-green-400' : 'bg-gray-200'
                    }`} />
                  )}
                  <div className={`relative w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                    done ? 'bg-green-500 text-white' : active ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    <step.icon size={14} />
                  </div>
                  <span className={`text-xs mt-1.5 ${done || active ? 'text-gray-700' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {order.logistics && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-orange-500" />
              <span className="font-medium text-gray-800">物流信息</span>
            </div>
            <span className="text-xs text-gray-400">{order.logistics.courier} {order.logistics.trackingNo}</span>
          </div>
          <div className="space-y-3">
            {[...order.logistics.trackingHistory].reverse().map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-orange-500' : 'bg-gray-300'}`} />
                  {i < order.logistics!.trackingHistory.length - 1 && (
                    <div className="flex-1 w-0.5 bg-gray-200 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-3">
                  <p className={`text-sm ${i === 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                    {item.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.time)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {order.product && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
          <Link to={`/product/${order.productId}`} className="flex gap-3">
            <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
              <img src={order.product.images?.[0]} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 line-clamp-2 leading-snug">{order.product.title}</p>
              <p className="text-orange-500 font-bold mt-2">¥{order.price}</p>
            </div>
            <ChevronRight className="text-gray-300 self-center" size={18} />
          </Link>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 space-y-3">
        <p className="font-medium text-gray-800 mb-2">收货信息</p>
        <div className="flex items-start gap-2 text-sm">
          <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-gray-700">{order.address}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone size={16} className="text-gray-400 flex-shrink-0" />
          <span className="text-gray-700">{order.phone}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">订单编号</span>
          <span className="text-gray-800">{order.orderNo}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">创建时间</span>
          <span className="text-gray-800">{formatDate(order.createdAt)}</span>
        </div>
        {order.paidAt && (
          <div className="flex justify-between">
            <span className="text-gray-500">付款时间</span>
            <span className="text-gray-800">{formatDate(order.paidAt)}</span>
          </div>
        )}
        {order.shippedAt && (
          <div className="flex justify-between">
            <span className="text-gray-500">发货时间</span>
            <span className="text-gray-800">{formatDate(order.shippedAt)}</span>
          </div>
        )}
        {order.buyerRemark && (
          <div className="flex justify-between">
            <span className="text-gray-500">买家留言</span>
            <span className="text-gray-800">{order.buyerRemark}</span>
          </div>
        )}
        {order.inspectionResult && (
          <div className="flex justify-between">
            <span className="text-gray-500">验货结果</span>
            <span className={order.inspectionResult === 'passed' ? 'text-green-600' : 'text-red-500'}>
              {order.inspectionResult === 'passed' ? '通过' : '未通过'}
              {order.inspectionRemark && ` - ${order.inspectionRemark}`}
            </span>
          </div>
        )}
      </div>

      {order.buyer && order.seller && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 space-y-3">
          <p className="font-medium text-gray-800 mb-2">交易双方</p>
          <div className="flex items-center gap-3">
            <User size={16} className="text-gray-400" />
            <img src={order.buyer.avatar} alt="" className="w-7 h-7 rounded-full bg-gray-100" />
            <span className="text-sm text-gray-700">买家：{order.buyer.nickname}</span>
          </div>
          <div className="flex items-center gap-3">
            <Home size={16} className="text-gray-400" />
            <img src={order.seller.avatar} alt="" className="w-7 h-7 rounded-full bg-gray-100" />
            <span className="text-sm text-gray-700">卖家：{order.seller.nickname}</span>
          </div>
        </div>
      )}

      <div className="fixed bottom-16 sm:bottom-4 left-0 right-0 sm:static px-4 sm:px-0 z-30">
        <div className="max-w-3xl mx-auto bg-white sm:bg-transparent sm:border-0 border-t border-gray-100 py-3 sm:py-0 flex gap-2 sm:justify-end">
          {order.status === 'pending_payment' && isBuyer && (
            <>
              <Button variant="secondary" onClick={() => handleAction(() => api.cancelOrder(order.id), '订单已取消')}>
                取消订单
              </Button>
              <Button onClick={() => handleAction(() => api.payOrder(order.id), '支付成功')}>
                立即支付 ¥{order.price}
              </Button>
            </>
          )}
          {order.status === 'paid' && isSeller && (
            <Button onClick={() => setShowShip(true)}>去发货</Button>
          )}
          {order.status === 'shipped' && isBuyer && (
            <Button onClick={() => handleAction(() => api.confirmDelivery(order.id), '已确认收货')}>
              确认收货
            </Button>
          )}
          {order.status === 'delivered' && isBuyer && (
            <>
              <Button variant="secondary" onClick={() => setShowReturn(true)}>申请退货</Button>
              <Button variant="secondary" onClick={() => handleAction(
                () => api.inspectOrder(order.id, { passed: false, inspectionRemark: '商品与描述不符' }),
                '验货失败，已退款'
              )}>
                验货不通过
              </Button>
              <Button onClick={() => handleAction(
                () => api.inspectOrder(order.id, { passed: true }),
                '验货通过'
              )}>
                验货通过
              </Button>
            </>
          )}
          {order.status === 'inspection_passed' && isBuyer && (
            <>
              <Button variant="secondary" onClick={() => setShowReturn(true)}>申请退货</Button>
              <Button onClick={() => handleAction(() => api.completeOrder(order.id), '交易完成')}>
                确认完成
              </Button>
            </>
          )}
          {order.status === 'completed' && isBuyer && (
            <Button variant="secondary" onClick={() => setShowReturn(true)}>申请退货</Button>
          )}
          {order.status === 'return_requested' && (
            <Link to={`/returns/${findReturnId(order.id)}`} className="inline-flex">
              <Button>查看退货进度</Button>
            </Link>
          )}
        </div>
      </div>

      <Modal open={showShip} onClose={() => setShowShip(false)} title="填写发货信息">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">物流公司</label>
            <input
              value={courier}
              onChange={e => setCourier(e.target.value)}
              placeholder="顺丰速运、圆通等"
              className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">快递单号</label>
            <input
              value={trackingNo}
              onChange={e => setTrackingNo(e.target.value)}
              placeholder="请输入快递单号（可留空自动生成）"
              className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowShip(false)}>取消</Button>
            <Button className="flex-1" onClick={() => handleAction(
              () => api.shipOrder(order.id, { trackingNo, courier }),
              '已发货'
            ).then(() => setShowShip(false))} disabled={actionLoading}>
              {actionLoading ? '处理中...' : '确认发货'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showReturn} onClose={() => setShowReturn(false)} title="申请退货">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">退货原因 *</label>
            <select
              value={returnReason}
              onChange={e => setReturnReason(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400"
            >
              <option value="">请选择原因</option>
              <option>商品与描述不符</option>
              <option>商品质量问题</option>
              <option>发错货/漏发货</option>
              <option>不想要了</option>
              <option>其他原因</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">详细描述</label>
            <textarea
              value={returnDesc}
              onChange={e => setReturnDesc(e.target.value)}
              rows={3}
              placeholder="请详细描述退货原因..."
              className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowReturn(false)}>取消</Button>
            <Button
              className="flex-1"
              disabled={!returnReason || actionLoading}
              onClick={() => {
                if (!returnReason) return;
                handleAction(
                  () => api.createReturn(order.id, { reason: returnReason, description: returnDesc }),
                  '退货申请已提交'
                ).then(() => setShowReturn(false));
              }}
            >
              {actionLoading ? '提交中...' : '提交申请'}
            </Button>
          </div>
        </div>
      </Modal>

      <ReturnModals
        order={order}
        onReload={reload}
        actionLoading={actionLoading}
        setActionLoading={setActionLoading}
        showReject={showReject}
        setShowReject={setShowReject}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        showShipBack={showShipBack}
        setShowShipBack={setShowShipBack}
        returnTracking={returnTracking}
        setReturnTracking={setReturnTracking}
        returnCourier={returnCourier}
        setReturnCourier={setReturnCourier}
      />
    </div>
  );
}

function findReturnId(orderId: number): number {
  return orderId;
}

function ReturnModals(props: any) {
  return null;
}
