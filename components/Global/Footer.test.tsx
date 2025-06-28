import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import pkg from '@/package.json';
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
    });

    it('renders version number', () => {
        render(<GlobalFooter />);
        const version = pkg.version;
        expect(screen.getByText(`v${version}`)).toBeInTheDocument();
    });

    it('matches snapshot', () => {
        const { asFragment } = render(<GlobalFooter />);
        expect(asFragment()).toMatchSnapshot();
    });
});
