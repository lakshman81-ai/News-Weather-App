import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NewsSection from './NewsSection';

describe('NewsSection', () => {
    const mockNews = [
        {
            id: 1,
            headline: 'Test Headline 1',
            source: 'Test Source',
            time: '2h ago',
            url: 'https://example.com/story1',
            confidence: 'High',
            sourceCount: 5
        },
        {
            id: 2,
            headline: 'Test Headline 2',
            source: 'Test Source',
            time: '3h ago',
            confidence: 'Medium'
            // No URL, checks fallback behavior
        }
    ];

    it('renders the section title and news items', () => {
        render(<NewsSection title="Test News" icon="📰" news={mockNews} />);

        expect(screen.getByText('Test News')).toBeInTheDocument();
        expect(screen.getByText('Test Headline 1')).toBeInTheDocument();
        expect(screen.getByText('Test Headline 2')).toBeInTheDocument();
    });

    it('displays correct number of items based on maxDisplay', () => {
        render(<NewsSection title="Test News" icon="📰" news={mockNews} maxDisplay={1} />);

        expect(screen.getByText('Test Headline 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Headline 2')).not.toBeInTheDocument();
    });

    it('opens story URL when clicked', () => {
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => { });
        render(<NewsSection title="Test News" icon="📰" news={mockNews} />);

        // Click the first item which has a direct URL
        fireEvent.click(screen.getByText('Test Headline 1').closest('article'));

        expect(openSpy).toHaveBeenCalledWith('https://example.com/story1', '_blank', 'noopener,noreferrer');
        openSpy.mockRestore();
    });

    it('falls back to Google Search when no URL is present', () => {
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => { });
        render(<NewsSection title="Test News" icon="📰" news={mockNews} />);

        // Click the second item which has NO URL
        fireEvent.click(screen.getByText('Test Headline 2').closest('article'));

        const expectedSearchUrl = 'https://www.google.com/search?q=' + encodeURIComponent('Test Headline 2 news');
        expect(openSpy).toHaveBeenCalledWith(expectedSearchUrl, '_blank', 'noopener,noreferrer');
        openSpy.mockRestore();
    });

    it('displays confidence and source count correctly', () => {
        render(<NewsSection title="Test News" icon="📰" news={mockNews} />);

        expect(screen.getByText('High')).toHaveClass('news-item__confidence--high');
        expect(screen.getByText('5 sources')).toBeInTheDocument();
    });
});
