import React, { useState, useEffect } from 'react';
import { userService, AuthUser } from '../lib/supabase';
import { Edit, RefreshCw, KeyRound, X, Eye, EyeOff, UserPlus, Ban, Mail, AlertTriangle } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // State for modals
  const [passwordChangeUser, setPasswordChangeUser] = useState<AuthUser | null>(null);
  const [emailChangeUser, setEmailChangeUser] = useState<AuthUser | null>(null);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  // State for forms
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUserData, setNewUserData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const usersData = await userService.getUsers();
      setUsers(usersData);
    } catch (err: any) {
      // Handle specific error messages
      if (err.message && (err.message.includes('Forbidden use of secret API key') || err.status === 401)) {
        setError('Supabase Security Restriction: Admin operations (like listing users) are blocked from the browser when using the Service Role Key. This is a security feature of Supabase. To manage users, please use the Supabase Dashboard directly.');
      } else if (err.message && (err.message.includes('invalid or missing') || err.message.includes('JWT'))) {
        setError(err.message);
      } else {
        setError(err.message || 'Failed to load users.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordChangeUser || !newPassword) return;
    if (newPassword.length < 6) {
        setError("يجب أن تكون كلمة المرور 6 أحرف على الأقل.");
        return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await userService.updateUserPassword(passwordChangeUser.id, newPassword);
      setSuccess(`تم تحديث كلمة المرور للمستخدم ${passwordChangeUser.email} بنجاح.`);
      setPasswordChangeUser(null);
      setNewPassword('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.email || !newUserData.password) return;
     if (newUserData.password.length < 6) {
        setError("يجب أن تكون كلمة المرور 6 أحرف على الأقل.");
        return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await userService.createUser(newUserData.email, newUserData.password);
      setSuccess(`تم إنشاء المستخدم ${newUserData.email} بنجاح.`);
      setIsCreateUserModalOpen(false);
      setNewUserData({ email: '', password: '' });
      fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailChangeUser || !newEmail) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await userService.updateUserEmail(emailChangeUser.id, newEmail);
      setSuccess(`تم تحديث بريد المستخدم بنجاح.`);
      setEmailChangeUser(null);
      setNewEmail('');
      fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBan = async (userId: string, isCurrentlyBanned: boolean) => {
    const action = isCurrentlyBanned ? 'رفع الحظر عن' : 'حظر';
    if (!window.confirm(`هل أنت متأكد أنك تريد ${action} هذا المستخدم؟`)) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await userService.toggleUserBan(userId, isCurrentlyBanned);
      setSuccess(`تم ${action} المستخدم بنجاح.`);
      fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isBanned = (user: AuthUser) => user.banned_until && new Date(user.banned_until) > new Date();

  if (error) {
    return (
      <div className="p-8 bg-slate-800 rounded-2xl border border-red-500/50 text-center max-w-3xl mx-auto mt-10">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-white mb-4">خطأ في الاتصال الإداري</h3>
        <p className="text-gray-300 mb-6 leading-relaxed bg-slate-900/50 p-4 rounded-lg border border-slate-700 font-mono text-sm text-left">
          {error}
        </p>
        
        <div className="bg-slate-900/50 p-4 rounded-xl text-left mb-6 border border-slate-700">
          <h4 className="text-cyan-400 font-bold mb-2 text-sm uppercase tracking-wider">خطوات الإصلاح:</h4>
          <ol className="text-sm text-gray-400 list-decimal list-inside space-y-2">
            <li>تأكد من أنك تستخدم مفتاح <code>service_role</code> الصحيح (يبدأ بـ <code>ey...</code>) وليس مفتاح سري آخر.</li>
            <li>إذا كنت تستخدم المفتاح الصحيح، فإن Supabase تمنع استخدامه من المتصفح لأسباب أمنية.</li>
            <li>لإدارة المستخدمين، يرجى استخدام لوحة تحكم Supabase الرسمية.</li>
          </ol>
        </div>

        <div className="flex justify-center gap-4">
            <button 
            onClick={fetchUsers} 
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition-all"
            >
            إعادة المحاولة
            </button>
            <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noreferrer"
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all"
            >
                فتح لوحة تحكم Supabase
            </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">إدارة المستخدمين ({users.length})</h3>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button onClick={() => setIsCreateUserModalOpen(true)} className="p-2 text-white bg-green-600 hover:bg-green-700 transition-colors rounded-lg flex items-center space-x-2 text-sm">
                <UserPlus className="w-4 h-4" />
                <span>إنشاء مستخدم</span>
            </button>
            <button onClick={fetchUsers} disabled={loading} className="p-2 text-gray-300 hover:text-white transition-colors rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      {success && <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 text-green-400 text-center">{success}</div>}

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="p-3 font-medium text-gray-300">المستخدم (البريد)</th>
                <th className="p-3 font-medium text-gray-300">الحالة</th>
                <th className="p-3 font-medium text-gray-300">تاريخ الإنشاء</th>
                <th className="p-3 font-medium text-gray-300">آخر تسجيل دخول</th>
                <th className="p-3 font-medium text-gray-300">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">جاري تحميل المستخدمين...</td></tr>
              ) : users.map((user) => {
                const banned = isBanned(user);
                return (
                    <tr key={user.id} className={`border-b border-slate-700 hover:bg-slate-700/30 transition-colors ${banned ? 'bg-red-900/20' : ''}`}>
                        <td className="p-3 text-white font-medium">{user.email}</td>
                        <td className="p-3">
                            {banned ? 
                                <span className="text-red-400 font-bold">محظور</span> : 
                                <span className="text-green-400">نشط</span>
                            }
                        </td>
                        <td className="p-3 text-gray-400">{new Date(user.created_at).toLocaleString()}</td>
                        <td className="p-3 text-gray-400">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'لم يسجل دخوله'}</td>
                        <td className="p-3">
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <button onClick={() => { setPasswordChangeUser(user); setNewPassword(''); setError(null); }} className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors" title="تغيير كلمة المرور">
                                    <KeyRound className="w-4 h-4" />
                                </button>
                                <button onClick={() => { setEmailChangeUser(user); setNewEmail(user.email || ''); setError(null); }} className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors" title="تعديل البريد الإلكتروني">
                                    <Mail className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleToggleBan(user.id, banned)} disabled={saving} className={`p-2 transition-colors disabled:opacity-50 ${banned ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'}`} title={banned ? 'رفع الحظر' : 'حظر المستخدم'}>
                                    <Ban className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 max-w-md w-full animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">إنشاء مستخدم جديد</h3>
              <button onClick={() => setIsCreateUserModalOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">البريد الإلكتروني</label>
                <input type="email" value={newUserData.email} onChange={(e) => setNewUserData({...newUserData, email: e.target.value})} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">كلمة المرور</label>
                <input type="password" value={newUserData.password} onChange={(e) => setNewUserData({...newUserData, password: e.target.value})} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white" required />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsCreateUserModalOpen(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">إلغاء</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
                  {saving ? 'جاري الإنشاء...' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Email Modal */}
      {emailChangeUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 max-w-md w-full animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">تعديل البريد الإلكتروني</h3>
              <button onClick={() => setEmailChangeUser(null)} className="p-2 text-gray-400 hover:text-white rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <p className="text-gray-400 mb-6">تعديل بريد المستخدم <strong className="text-white">{emailChangeUser.email}</strong>.</p>
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">البريد الإلكتروني الجديد</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white" required />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setEmailChangeUser(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">إلغاء</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg disabled:opacity-50">
                  {saving ? 'جاري التحديث...' : 'تحديث البريد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passwordChangeUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 max-w-md w-full animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">تغيير كلمة المرور</h3>
              <button onClick={() => setPasswordChangeUser(null)} className="p-2 text-gray-400 hover:text-white rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <p className="text-gray-400 mb-6">تعيين كلمة مرور جديدة للمستخدم <strong className="text-white">{passwordChangeUser.email}</strong>.</p>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">كلمة المرور الجديدة</label>
                <div className="relative">
                  <KeyRound className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pr-10 rtl:pl-10 rtl:pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white"
                    required
                  />
                   <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setPasswordChangeUser(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">إلغاء</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg disabled:opacity-50">
                  {saving ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
