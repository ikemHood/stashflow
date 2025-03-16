import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from '@tanstack/react-router';
import TabBar from '../components/TabBar';
import { toast } from 'sonner';
import {
    ChevronRightIcon,
    ShieldCheckIcon,
    DevicePhoneMobileIcon,
    ArrowLeftOnRectangleIcon,
    XMarkIcon,
    ComputerDesktopIcon,
    DeviceTabletIcon,
    LockClosedIcon,
} from '@heroicons/react/24/outline';
import { useDevices, useLogoutDevice, useLogoutAllDevices } from '../hooks/useAuth';

// Device type from the API
interface ApiDevice {
    id: string;
    deviceName: string;
    userAgent: string;
    ipAddress: string;
    createdAt: string;
    lastUsedAt: string;
    hasPin: boolean;
    current: boolean;
}

const ProfileScreen: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [logoutLoading, setLogoutLoading] = useState<boolean>(false);
    const [loggingOutDeviceIds, setLoggingOutDeviceIds] = useState<string[]>([]);
    const [loggingOutAllDevices, setLoggingOutAllDevices] = useState<boolean>(false);

    // Use the device hooks
    const { data: devicesData, isLoading, error, refetch: refetchDevices } = useDevices();
    const logoutDeviceMutation = useLogoutDevice();
    const logoutAllDevicesMutation = useLogoutAllDevices();

    // Parse devices from the API response
    const devices: ApiDevice[] = devicesData?.data?.devices || [];

    const handleLogout = async () => {
        try {
            setLogoutLoading(true);
            await logout();
            navigate({ to: '/login' });
        } catch (error) {
            toast.error('Failed to logout. Please try again.');
        } finally {
            setLogoutLoading(false);
        }
    };

    const handleLogoutDevice = async (deviceId: string) => {
        try {
            setLoggingOutDeviceIds(prev => [...prev, deviceId]);
            await logoutDeviceMutation.mutateAsync(deviceId);
            toast.success('Device logged out successfully');
        } catch (err) {
            toast.error('Failed to logout device');
        } finally {
            setLoggingOutDeviceIds(prev => prev.filter(id => id !== deviceId));
        }
    };

    const handleLogoutAllDevices = async () => {
        try {
            setLoggingOutAllDevices(true);
            await logoutAllDevicesMutation.mutateAsync();
            toast.success('All other devices logged out');
        } catch (err) {
            toast.error('Failed to logout all devices');
        } finally {
            setLoggingOutAllDevices(false);
        }
    };

    // Get initials for the avatar
    const getInitials = () => {
        if (!user?.name) return 'U';
        return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    // Format the last used date to a readable format
    const formatLastActive = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get the appropriate icon for the device type
    const getDeviceIcon = (device: ApiDevice) => {
        const userAgent = device.userAgent || '';

        if (userAgent.includes('Windows') || userAgent.includes('Mac') || userAgent.includes('Linux')) {
            return <ComputerDesktopIcon className="w-5 h-5 text-gray-500 mr-3" />;
        } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
            return <DeviceTabletIcon className="w-5 h-5 text-gray-500 mr-3" />;
        } else {
            return <DevicePhoneMobileIcon className="w-5 h-5 text-gray-500 mr-3" />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="p-5 flex justify-between items-center border-b border-gray-200">
                <h1 className="text-xl font-bold text-gray-900">Profile</h1>
            </div>

            <div className="flex-1 px-5 pb-20 overflow-y-auto">
                {/* Profile Info Section */}
                <div className="py-6 flex items-center">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-semibold text-xl mr-4">
                        {getInitials()}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{user?.name || 'User'}</h2>
                        <p className="text-sm text-gray-500">{user?.email || 'user@example.com'}</p>
                    </div>
                </div>

                {/* Account Settings Section */}
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase">Account Settings</h3>
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                        <button className="w-full p-4 flex items-center justify-between border-b border-gray-100">
                            <div className="flex items-center">
                                <ShieldCheckIcon className="w-5 h-5 text-gray-500 mr-3" />
                                <span className="text-gray-900">Security</span>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                        </button>
                        <button className="w-full p-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-gray-900">Preferences</span>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Login Devices Section */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Login Devices</h3>
                        {devices.length > 1 && (
                            <button
                                onClick={handleLogoutAllDevices}
                                disabled={loggingOutAllDevices}
                                className="text-sm text-primary font-medium disabled:opacity-50 flex items-center"
                            >
                                {loggingOutAllDevices ? (
                                    <>
                                        <div className="mr-2 w-3 h-3 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
                                        Processing...
                                    </>
                                ) : 'Logout All'}
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                        {isLoading ? (
                            <div className="p-8 flex justify-center items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                            </div>
                        ) : error ? (
                            <div className="p-6 text-center">
                                <p className="text-red-500 mb-4">Failed to load devices</p>
                                <button
                                    onClick={() => refetchDevices()}
                                    className="bg-primary text-white font-medium py-2 px-4 rounded-lg"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : devices.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                No devices found
                            </div>
                        ) : (
                            devices.map((device) => {
                                const isLoggingOut = loggingOutDeviceIds.includes(device.id);

                                return (
                                    <div key={device.id} className="p-4 flex items-center justify-between border-b border-gray-100 last:border-b-0">
                                        <div className="flex items-center">
                                            {getDeviceIcon(device)}
                                            <div>
                                                <div className="flex items-center">
                                                    <p className="text-gray-900">{device.deviceName}</p>
                                                    {device.current && (
                                                        <span className="ml-2 text-xs bg-green-100 text-green-800 py-0.5 px-2 rounded-full">Current</span>
                                                    )}
                                                    {device.hasPin && (
                                                        <span className="ml-2 flex items-center text-xs text-blue-600">
                                                            <LockClosedIcon className="w-3 h-3 mr-1" />PIN
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">Last active: {formatLastActive(device.lastUsedAt)}</p>
                                                {device.ipAddress && (
                                                    <p className="text-xs text-gray-400">IP: {device.ipAddress}</p>
                                                )}
                                            </div>
                                        </div>
                                        {!device.current && (
                                            <button
                                                onClick={() => handleLogoutDevice(device.id)}
                                                disabled={isLoggingOut}
                                                className="text-red-500 p-2 disabled:opacity-50"
                                            >
                                                {isLoggingOut ? (
                                                    <div className="w-5 h-5 rounded-full border-t-2 border-b-2 border-red-500 animate-spin"></div>
                                                ) : (
                                                    <XMarkIcon className="w-5 h-5" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-center text-red-500 font-medium disabled:opacity-50"
                >
                    {logoutLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-500 mr-2"></div>
                            Logging out...
                        </>
                    ) : (
                        <>
                            <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />
                            Logout
                        </>
                    )}
                </button>
            </div>
            <TabBar activeTab="profile" />
        </div>
    );
};

export default ProfileScreen; 