import type {
  ModerationStatus,
  ReportReason,
  Report,
  ModerationAction,
  ContentGuidelines
} from '../moderation';

describe('moderation types', () => {
  describe('ModerationStatus type', () => {
    it('should accept pending status', () => {
      const status: ModerationStatus = 'pending';
      expect(status).toBe('pending');
    });

    it('should accept approved status', () => {
      const status: ModerationStatus = 'approved';
      expect(status).toBe('approved');
    });

    it('should accept rejected status', () => {
      const status: ModerationStatus = 'rejected';
      expect(status).toBe('rejected');
    });

    it('should work in arrays', () => {
      const statuses: ModerationStatus[] = ['pending', 'approved', 'rejected'];
      expect(statuses).toHaveLength(3);
    });
  });

  describe('ReportReason type', () => {
    it('should accept inappropriate_content reason', () => {
      const reason: ReportReason = 'inappropriate_content';
      expect(reason).toBe('inappropriate_content');
    });

    it('should accept false_information reason', () => {
      const reason: ReportReason = 'false_information';
      expect(reason).toBe('false_information');
    });

    it('should accept spam reason', () => {
      const reason: ReportReason = 'spam';
      expect(reason).toBe('spam');
    });

    it('should accept not_eco_friendly reason', () => {
      const reason: ReportReason = 'not_eco_friendly';
      expect(reason).toBe('not_eco_friendly');
    });

    it('should accept misleading_sustainability_claims reason', () => {
      const reason: ReportReason = 'misleading_sustainability_claims';
      expect(reason).toBe('misleading_sustainability_claims');
    });

    it('should accept other reason', () => {
      const reason: ReportReason = 'other';
      expect(reason).toBe('other');
    });

    it('should work in arrays', () => {
      const reasons: ReportReason[] = [
        'inappropriate_content',
        'false_information',
        'spam',
        'not_eco_friendly',
        'misleading_sustainability_claims',
        'other'
      ];
      expect(reasons).toHaveLength(6);
    });
  });

  describe('Report interface', () => {
    it('should accept basic report', () => {
      const report: Report = {
        id: 'report-123',
        listingId: 'listing-456',
        reason: 'spam',
        description: 'This looks like spam',
        status: 'pending',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      };
      expect(report.id).toBe('report-123');
      expect(report.status).toBe('pending');
    });

    it('should accept report with reporter ID', () => {
      const report: Report = {
        id: 'report-1',
        listingId: 'listing-1',
        reporterId: 'user-123',
        reason: 'false_information',
        description: 'Information is incorrect',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(report.reporterId).toBe('user-123');
    });

    it('should accept anonymous report without reporter ID', () => {
      const report: Report = {
        id: 'report-2',
        listingId: 'listing-2',
        reason: 'inappropriate_content',
        description: 'Content is inappropriate',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(report.reporterId).toBeUndefined();
    });

    it('should accept report with evidence', () => {
      const report: Report = {
        id: 'report-3',
        listingId: 'listing-3',
        reason: 'misleading_sustainability_claims',
        description: 'Claims are not verified',
        evidence: 'https://example.com/proof.jpg',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(report.evidence).toBe('https://example.com/proof.jpg');
    });

    it('should accept approved report with moderator info', () => {
      const report: Report = {
        id: 'report-4',
        listingId: 'listing-4',
        reporterId: 'user-1',
        reason: 'spam',
        description: 'Spam content',
        status: 'approved',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        moderatorId: 'mod-123',
        moderatorNotes: 'Confirmed as spam'
      };
      expect(report.status).toBe('approved');
      expect(report.moderatorId).toBe('mod-123');
      expect(report.moderatorNotes).toBe('Confirmed as spam');
    });

    it('should track creation and update dates', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-05');
      
      const report: Report = {
        id: 'report-5',
        listingId: 'listing-5',
        reason: 'other',
        description: 'Other issue',
        status: 'rejected',
        createdAt,
        updatedAt
      };
      
      expect(report.createdAt).toEqual(createdAt);
      expect(report.updatedAt).toEqual(updatedAt);
    });
  });

  describe('ModerationAction interface', () => {
    it('should accept approve action', () => {
      const action: ModerationAction = {
        id: 'action-123',
        listingId: 'listing-456',
        moderatorId: 'mod-789',
        action: 'approve',
        reason: 'Content meets guidelines',
        createdAt: new Date()
      };
      expect(action.action).toBe('approve');
    });

    it('should accept reject action', () => {
      const action: ModerationAction = {
        id: 'action-1',
        listingId: 'listing-1',
        moderatorId: 'mod-1',
        action: 'reject',
        reason: 'Does not meet sustainability criteria',
        createdAt: new Date()
      };
      expect(action.action).toBe('reject');
    });

    it('should accept flag action', () => {
      const action: ModerationAction = {
        id: 'action-2',
        listingId: 'listing-2',
        moderatorId: 'mod-2',
        action: 'flag',
        reason: 'Requires additional review',
        createdAt: new Date()
      };
      expect(action.action).toBe('flag');
    });

    it('should accept request_changes action', () => {
      const action: ModerationAction = {
        id: 'action-3',
        listingId: 'listing-3',
        moderatorId: 'mod-3',
        action: 'request_changes',
        reason: 'Information needs updating',
        createdAt: new Date()
      };
      expect(action.action).toBe('request_changes');
    });

    it('should accept action without changes array', () => {
      const action: ModerationAction = {
        id: 'action-4',
        listingId: 'listing-4',
        moderatorId: 'mod-4',
        action: 'approve',
        reason: 'Approved',
        createdAt: new Date()
      };
      expect(action.changes).toBeUndefined();
    });

    it('should accept action with changes array', () => {
      const action: ModerationAction = {
        id: 'action-5',
        listingId: 'listing-5',
        moderatorId: 'mod-5',
        action: 'request_changes',
        reason: 'Multiple fields need updates',
        changes: [
          {
            field: 'description',
            currentValue: 'Old description',
            suggestedValue: 'New description',
            reason: 'More accurate information needed'
          },
          {
            field: 'address',
            currentValue: '123 Old St',
            suggestedValue: '456 New Ave',
            reason: 'Address has changed'
          }
        ],
        createdAt: new Date()
      };
      expect(action.changes).toHaveLength(2);
      expect(action.changes?.[0].field).toBe('description');
    });

    it('should accept empty changes array', () => {
      const action: ModerationAction = {
        id: 'action-6',
        listingId: 'listing-6',
        moderatorId: 'mod-6',
        action: 'request_changes',
        reason: 'Changes needed',
        changes: [],
        createdAt: new Date()
      };
      expect(action.changes).toHaveLength(0);
    });
  });

  describe('ContentGuidelines interface', () => {
    it('should accept basic guidelines', () => {
      const guidelines: ContentGuidelines = {
        id: 'guideline-1',
        category: 'coworking',
        rules: [],
        lastUpdated: new Date()
      };
      expect(guidelines.category).toBe('coworking');
    });

    it('should accept guidelines with single rule', () => {
      const guidelines: ContentGuidelines = {
        id: 'guideline-2',
        category: 'cafe',
        rules: [
          {
            title: 'Eco-Friendly Practices',
            description: 'Must demonstrate sustainable practices',
            examples: {
              good: ['Uses renewable energy', 'Composts waste'],
              bad: ['No recycling program', 'Single-use plastics']
            }
          }
        ],
        lastUpdated: new Date()
      };
      expect(guidelines.rules).toHaveLength(1);
      expect(guidelines.rules[0].title).toBe('Eco-Friendly Practices');
    });

    it('should accept guidelines with multiple rules', () => {
      const guidelines: ContentGuidelines = {
        id: 'guideline-3',
        category: 'accommodation',
        rules: [
          {
            title: 'Sustainability',
            description: 'Environmental practices',
            examples: {
              good: ['Solar panels', 'Water conservation'],
              bad: ['Excessive water use', 'No recycling']
            }
          },
          {
            title: 'Accessibility',
            description: 'Facility access requirements',
            examples: {
              good: ['Wheelchair ramps', 'Accessible rooms'],
              bad: ['Stairs only', 'No accessible facilities']
            }
          }
        ],
        lastUpdated: new Date()
      };
      expect(guidelines.rules).toHaveLength(2);
    });

    it('should handle examples with multiple items', () => {
      const guidelines: ContentGuidelines = {
        id: 'guideline-4',
        category: 'restaurant',
        rules: [
          {
            title: 'Local Sourcing',
            description: 'Use local ingredients',
            examples: {
              good: [
                'Sources from local farms',
                'Seasonal menu',
                'Local suppliers listed'
              ],
              bad: [
                'Imports all ingredients',
                'No local partnerships',
                'Frozen foods only'
              ]
            }
          }
        ],
        lastUpdated: new Date()
      };
      expect(guidelines.rules[0].examples.good).toHaveLength(3);
      expect(guidelines.rules[0].examples.bad).toHaveLength(3);
    });

    it('should track lastUpdated date', () => {
      const date = new Date('2024-06-15');
      const guidelines: ContentGuidelines = {
        id: 'guideline-5',
        category: 'activities',
        rules: [],
        lastUpdated: date
      };
      expect(guidelines.lastUpdated).toEqual(date);
    });
  });

  describe('Integration scenarios', () => {
    it('should support report workflow', () => {
      const report: Report = {
        id: 'report-workflow',
        listingId: 'listing-1',
        reporterId: 'user-1',
        reason: 'false_information',
        description: 'Information is outdated',
        status: 'pending',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      expect(report.status).toBe('pending');

      const action: ModerationAction = {
        id: 'action-1',
        listingId: report.listingId,
        moderatorId: 'mod-1',
        action: 'request_changes',
        reason: 'Information needs verification',
        changes: [
          {
            field: 'description',
            currentValue: 'Old info',
            suggestedValue: 'Updated info',
            reason: 'Information is outdated'
          }
        ],
        createdAt: new Date('2024-01-02')
      };

      expect(action.listingId).toBe(report.listingId);
    });

    it('should support filtering reports by status', () => {
      const reports: Report[] = [
        {
          id: '1',
          listingId: 'listing-1',
          reason: 'spam',
          description: 'Spam',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          listingId: 'listing-2',
          reason: 'spam',
          description: 'Spam',
          status: 'approved',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          listingId: 'listing-3',
          reason: 'spam',
          description: 'Spam',
          status: 'rejected',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const pending = reports.filter(r => r.status === 'pending');
      const approved = reports.filter(r => r.status === 'approved');
      
      expect(pending).toHaveLength(1);
      expect(approved).toHaveLength(1);
    });

    it('should support guidelines by category', () => {
      const allGuidelines: ContentGuidelines[] = [
        {
          id: 'g1',
          category: 'coworking',
          rules: [],
          lastUpdated: new Date()
        },
        {
          id: 'g2',
          category: 'cafe',
          rules: [],
          lastUpdated: new Date()
        }
      ];

      const coworkingGuidelines = allGuidelines.find(g => g.category === 'coworking');
      expect(coworkingGuidelines).toBeDefined();
      expect(coworkingGuidelines?.category).toBe('coworking');
    });
  });
});
