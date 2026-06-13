import { NavLink, useNavigate } from 'react-router-dom';
import { Home, PlusSquare, ShoppingBag, Heart, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from './UI';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast('已退出登录', 'success');
    navigate('/');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 text-xs ${
      isActive ? 'text-orange-500' : 'text-gray-500 hover:text-gray-700'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <NavLink to="/" className="font-bold text-xl bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            闲鱼集市
          </NavLink>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <NavLink to="/publish" className="hidden sm:flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-full text-sm font-medium">
                  <PlusSquare size={16} /> 发布
                </NavLink>
                <div className="flex items-center gap-2">
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full bg-gray-100" />
                  <span className="hidden sm:inline text-sm text-gray-700">{user.nickname}</span>
                </div>
                <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600" title="退出登录">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <NavLink to="/login" className="text-sm text-gray-600 hover:text-orange-500">登录/注册</NavLink>
            )}
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 sm:hidden">
        <div className="max-w-lg mx-auto grid grid-cols-5 h-16">
          <NavLink to="/" className={linkClass}>
            <Home size={22} />
            <span>首页</span>
          </NavLink>
          <NavLink to="/favorites" className={linkClass}>
            <Heart size={22} />
            <span>收藏</span>
          </NavLink>
          <NavLink to="/publish" className="flex flex-col items-center justify-center -mt-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 text-white flex items-center justify-center shadow-lg">
              <PlusSquare size={26} />
            </div>
            <span className="text-xs text-gray-500 mt-0.5">发布</span>
          </NavLink>
          <NavLink to="/orders" className={linkClass}>
            <ShoppingBag size={22} />
            <span>订单</span>
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            <User size={22} />
            <span>我的</span>
          </NavLink>
        </div>
      </nav>

      <nav className="hidden sm:block sticky top-14 z-30 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-10 flex items-center gap-6 text-sm">
          <NavLink to="/" className="text-gray-600 hover:text-orange-500">首页</NavLink>
          <NavLink to="/favorites" className="text-gray-600 hover:text-orange-500">我的收藏</NavLink>
          <NavLink to="/orders" className="text-gray-600 hover:text-orange-500">我的订单</NavLink>
          <NavLink to="/profile" className="text-gray-600 hover:text-orange-500">个人中心</NavLink>
        </div>
      </nav>
    </>
  );
}
