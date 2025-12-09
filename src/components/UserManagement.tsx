import React, { useState, useEffect } from 'react';
import { userService, AuthUser } from '../lib/supabase';
import { Users, UserPlus, Lock, Ban, CheckCircle, X, RefreshCw, Mail } from 'lucide-react';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await userService.getUsers();
            setUsers(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch users. Ensure you have the Service Role Key configured.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessingId('add');
        setError(null);
        try {
            await userService.createUser(newUserEmail, newUserPassword);
            setSuccess('User created successfully');
            setIsAddingUser(false);
            setNewUserEmail('');
            setNewUserPassword('');
            fetchUsers();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleToggleBan = async (user: AuthUser) => {
        if (!confirm(`Are you sure you want to ${user.banned_until ? 'unban' : 'ban'} this user?`)) return;
        setProcessingId(user.id);
        try {
            await userService.toggleUserBan(user.id, !!user.banned_until);
            setSuccess(`User ${user.banned_until ? 'unbanned' : 'banned'} successfully`);
            fetchUsers();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handlePasswordReset = async (userId: string) => {
        const newPassword = prompt("Enter new password (min 6 chars):");
        if (!newPassword) return;
        if (newPassword.length < 6) {
            alert("Password too short");
            return;
        }
        
        setProcessingId(userId);
        try {
            await userService.updateUserPassword(userId, newPassword);
            setSuccess('Password updated successfully');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-purple-400" />
                        User Management
                    </h2>
                    <p className="text-gray-400 mt-1">Manage admin access and user accounts</p>
                </div>
                <button 
                    onClick={() => setIsAddingUser(true)}
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/20"
                >
                    <UserPlus className="w-5 h-5" />
                    <span>Add User</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
                    <X className="w-5 h-5" />
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    {success}
                </div>
            )}

            {isAddingUser && (
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 animate-fade-in-up">
                    <h3 className="text-lg font-bold text-white mb-4">Create New User</h3>
                    <form onSubmit={handleAddUser} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                                <input 
                                    type="email" 
                                    value={newUserEmail}
                                    onChange={e => setNewUserEmail(e.target.value)}
                                    className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:border-cyan-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                                <input 
                                    type="password" 
                                    value={newUserPassword}
                                    onChange={e => setNewUserPassword(e.target.value)}
                                    className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:border-cyan-500 outline-none"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => setIsAddingUser(false)}
                                className="px-6 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={processingId === 'add'}
                                className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2"
                            >
                                {processingId === 'add' && <RefreshCw className="w-4 h-4 animate-spin" />}
                                Create User
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-gray-400 text-sm uppercase">
                            <tr>
                                <th className="p-6">User</th>
                                <th className="p-6">Created At</th>
                                <th className="p-6">Last Sign In</th>
                                <th className="p-6">Status</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">Loading users...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">No users found.</td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                                                    <Mail className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">{user.email}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{user.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-gray-400 text-sm">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-6 text-gray-400 text-sm">
                                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}
                                        </td>
                                        <td className="p-6">
                                            {user.banned_until ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                                                    <Ban className="w-3 h-3" /> Banned
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                                                    <CheckCircle className="w-3 h-3" /> Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handlePasswordReset(user.id)}
                                                    disabled={!!processingId}
                                                    className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Reset Password"
                                                >
                                                    <Lock className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleBan(user)}
                                                    disabled={!!processingId}
                                                    className={`p-2 rounded-lg transition-colors ${user.banned_until ? 'text-green-400 hover:bg-green-500/10' : 'text-red-400 hover:bg-red-500/10'}`}
                                                    title={user.banned_until ? 'Unban User' : 'Ban User'}
                                                >
                                                    {processingId === user.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
