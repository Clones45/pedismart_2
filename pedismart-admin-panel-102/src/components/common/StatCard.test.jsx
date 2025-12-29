import { render, screen } from '@testing-library/react';
import StatCard from './StatCard';
import { describe, it, expect } from 'vitest';
import { User } from 'lucide-react';

describe('StatCard', () => {
    it('renders with correct name and value', () => {
        render(<StatCard name="Total Users" icon={User} value="1,234" color="#F59E0B" />);
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('1,234')).toBeInTheDocument();
    });
});
