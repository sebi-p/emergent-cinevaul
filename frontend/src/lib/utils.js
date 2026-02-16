import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const STATUS_OPTIONS = [
  { value: 'plan_to_watch', label: 'Plan to Watch', color: 'amber' },
  { value: 'watching', label: 'Watching', color: 'blue' },
  { value: 'watched', label: 'Watched', color: 'emerald' },
];

export const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#f43f5e', // Rose
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

export const getStatusLabel = (status) => {
  return STATUS_OPTIONS.find(s => s.value === status)?.label || status;
};

export const getStatusClass = (status) => {
  const statusClasses = {
    'plan_to_watch': 'status-plan-to-watch',
    'watching': 'status-watching',
    'watched': 'status-watched',
  };
  return statusClasses[status] || '';
};

export const formatDate = (dateString) => {
  if (!dateString) return 'TBA';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const formatYear = (dateString) => {
  if (!dateString) return '';
  return dateString.substring(0, 4);
};

export const formatRuntime = (minutes) => {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

export const formatVoteAverage = (vote) => {
  if (!vote) return 'N/A';
  return vote.toFixed(1);
};
