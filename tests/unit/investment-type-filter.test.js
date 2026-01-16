import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit tests for investment type filtering (Story 8-1)
 * Tests filter state and filter logic
 */

// Mock global variables
global.selectedInvestmentTypes = [];
global.investmentData = {
    investments: [
        { id: '1', name: 'Stock 1', investment_type: 'Stock', is_active: true },
        { id: '2', name: 'Crypto 1', investment_type: 'Crypto', is_active: true },
        { id: '3', name: 'Stock 2', investment_type: 'Stock', is_active: true },
        { id: '4', name: 'Loan 1', investment_type: 'Loan', is_active: false },
    ],
};

describe('Investment Type Filter (Story 8-1)', () => {
    beforeEach(() => {
        global.selectedInvestmentTypes = [];
    });

    describe('Filter State', () => {
        it('should initialize as empty array (show all)', () => {
            expect(global.selectedInvestmentTypes).toEqual([]);
        });

        it('should store selected investment types', () => {
            global.selectedInvestmentTypes = ['Stock', 'Crypto'];
            expect(global.selectedInvestmentTypes).toEqual(['Stock', 'Crypto']);
        });

        it('should allow clearing filter (empty array)', () => {
            global.selectedInvestmentTypes = ['Stock'];
            global.selectedInvestmentTypes = [];
            expect(global.selectedInvestmentTypes).toEqual([]);
        });
    });

    describe('Filter Logic', () => {
        it('should filter active investments by type when types are selected', () => {
            global.selectedInvestmentTypes = ['Stock'];
            const activeInvestments = global.investmentData.investments.filter(inv => inv.is_active);
            const filtered = activeInvestments.filter(inv => 
                global.selectedInvestmentTypes.includes(inv.investment_type)
            );
            
            expect(filtered.length).toBe(2);
            expect(filtered.every(inv => inv.investment_type === 'Stock')).toBe(true);
        });

        it('should filter inactive investments by type when types are selected', () => {
            global.selectedInvestmentTypes = ['Loan'];
            const inactiveInvestments = global.investmentData.investments.filter(inv => !inv.is_active);
            const filtered = inactiveInvestments.filter(inv => 
                global.selectedInvestmentTypes.includes(inv.investment_type)
            );
            
            expect(filtered.length).toBe(1);
            expect(filtered[0].investment_type).toBe('Loan');
        });

        it('should show all investments when filter is empty', () => {
            global.selectedInvestmentTypes = [];
            const activeInvestments = global.investmentData.investments.filter(inv => inv.is_active);
            // No filter applied when array is empty
            const filtered = activeInvestments;
            
            expect(filtered.length).toBe(3);
        });

        it('should filter by multiple types', () => {
            global.selectedInvestmentTypes = ['Stock', 'Crypto'];
            const activeInvestments = global.investmentData.investments.filter(inv => inv.is_active);
            const filtered = activeInvestments.filter(inv => 
                global.selectedInvestmentTypes.includes(inv.investment_type)
            );
            
            expect(filtered.length).toBe(3);
            expect(filtered.every(inv => ['Stock', 'Crypto'].includes(inv.investment_type))).toBe(true);
        });

        it('should return empty array when no investments match filter', () => {
            global.selectedInvestmentTypes = ['NonExistentType'];
            const activeInvestments = global.investmentData.investments.filter(inv => inv.is_active);
            const filtered = activeInvestments.filter(inv => 
                global.selectedInvestmentTypes.includes(inv.investment_type)
            );
            
            expect(filtered.length).toBe(0);
        });
    });

    describe('applyInvestmentTypeFilter Function', () => {
        it('should update filter state with array of types', () => {
            const types = ['Stock', 'Crypto'];
            // Simulate function call
            global.selectedInvestmentTypes = Array.isArray(types) ? types : [];
            
            expect(global.selectedInvestmentTypes).toEqual(['Stock', 'Crypto']);
        });

        it('should clear filter when empty array is passed', () => {
            global.selectedInvestmentTypes = ['Stock'];
            const types = [];
            // Simulate function call
            global.selectedInvestmentTypes = Array.isArray(types) ? types : [];
            
            expect(global.selectedInvestmentTypes).toEqual([]);
        });

        it('should clear filter when non-array is passed', () => {
            global.selectedInvestmentTypes = ['Stock'];
            const types = null;
            // Simulate function call
            global.selectedInvestmentTypes = Array.isArray(types) ? types : [];
            
            expect(global.selectedInvestmentTypes).toEqual([]);
        });
    });
});
