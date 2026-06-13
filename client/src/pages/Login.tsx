import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/components/UI';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const { login, register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast('请输入用户名和密码', 'error');
      return;
    }
    try {
      if (mode === 'login') {
        await login(username, password);
        toast('登录成功', 'success');
      } else {
        await register(username, password, nickname || undefined, phone || undefined);
        toast('注册成功，已赠送 10000 余额', 'success');
      }
      navigate('/');
    } catch (e: any) {
      toast(e.message || '操作失败', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 text-white text-2xl font-bold shadow-lg mb-4">
            闲
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            闲鱼集市
          </h1>
          <p className="text-sm text-gray-500 mt-1">二手好物，捡漏天堂</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
          <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                mode === 'login' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                mode === 'register' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">用户名</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400 focus:bg-white transition"
              />
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">昵称（可选）</label>
                  <input
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="给自己起个好听的名字"
                    className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">手机号（可选）</label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="方便买家联系"
                    className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400 focus:bg-white transition"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium text-sm shadow-md disabled:opacity-60 transition"
            >
              {isLoading ? '处理中...' : mode === 'login' ? '登录' : '注册并赠送10000余额'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            {mode === 'login' ? '还没有账号？' : '已有账号？'}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-orange-500 hover:underline ml-1">
              {mode === 'login' ? '去注册' : '去登录'}
            </button>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">← 返回首页</Link>
        </div>
      </div>
    </div>
  );
}
