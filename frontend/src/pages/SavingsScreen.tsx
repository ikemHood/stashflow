import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMilestones } from '../context/MilestoneContext';
import { useNavigate } from '@tanstack/react-router';
import TabBar from '../components/TabBar';
import {
    PlusIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

const SavingsScreen: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const { milestones, fetchMilestones, isLoading, error } = useMilestones();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            fetchMilestones();
        }
    }, [fetchMilestones, isAuthenticated]);

    const handleAddNewGoal = () => {
        navigate({ to: '/add-milestone' });
    };

    const handleGoToDetail = (milestoneId: string) => {
        navigate({ to: '/savings/$milestoneId', params: { milestoneId } });
    };

    // Always return the same outer structure with TabBar
    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="p-5 flex justify-between items-center border-b border-gray-200">
                <h1 className="text-xl font-bold text-gray-900">My savings</h1>
                <button
                    onClick={handleAddNewGoal}
                    className="p-2 rounded-full bg-purple-100 hover:bg-purple-200"
                >
                    <PlusIcon className="w-5 h-5 text-purple-800" />
                </button>
            </div>

            <div className="flex-1 px-5 pb-20 overflow-y-auto">
                {/* Conditional content based on loading/error state */}
                {isLoading ? (
                    <div className="p-8 flex justify-center items-center">
                        <LoadingSpinner size="medium" />
                    </div>
                ) : error ? (
                    <div className="h-full flex flex-col justify-center items-center p-4">
                        <p className="text-red-500 mb-4">Failed to load savings goals</p>
                        <Button onClick={() => fetchMilestones()}>Try Again</Button>
                    </div>
                ) : (
                    <>
                        {milestones.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 py-4">
                                {milestones.map((milestone) => (
                                    <div
                                        key={milestone.id}
                                        className="bg-white rounded-xl shadow-sm overflow-hidden"
                                        onClick={() => handleGoToDetail(milestone.id)}
                                    >
                                        <div className="h-48 overflow-hidden">
                                            <img
                                                src={milestone.image || "/assets/target.png"}
                                                alt={milestone.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-lg">{milestone.name}</h3>
                                            <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                                                {milestone.description || `MacBook Pro (14-inch, M3, ${new Date().getFullYear()})`}
                                            </p>

                                            <div className="flex justify-between items-center mt-4">
                                                <span className="text-gray-700 font-medium">View</span>
                                                <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-10 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 mb-4">
                                    <img src="/assets/save.svg" alt="No savings" className="w-full h-full" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Savings Goals Yet</h3>
                                <p className="text-gray-500 text-sm mb-6 max-w-xs">
                                    Create your first savings goal to start tracking your progress
                                </p>
                                <button
                                    onClick={handleAddNewGoal}
                                    className="bg-primary text-white font-medium py-3 px-6 rounded-lg flex items-center"
                                >
                                    <PlusIcon className="w-5 h-5 mr-2" />
                                    Add New Goal
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <TabBar activeTab="savings" />
        </div>
    );
};

export default SavingsScreen; 