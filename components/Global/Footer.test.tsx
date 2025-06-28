import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GlobalFooter from './Footer';

describe('GlobalFooter', () => {
    it('renders copyright and version', () => {
        render(<GlobalFooter />);
        const year = new Date().getFullYear();
        expect(
            screen.getByText(
                `Copyright © 2025 - ${year} Streamer Stock. All rights reserved. 100% Human-Crafted Artisanal Code.`
            )
        ).toBeInTheDocument();
        expect(screen.getByText('v0.0.01')).toBeInTheDocument();
    })
});