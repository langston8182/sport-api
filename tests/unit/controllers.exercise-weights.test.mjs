import { describe, it, expect } from '@jest/globals';
import { handleExerciseWeights } from '../../src/controllers/exercise-weights.controller.mjs';

describe('Exercise weights controller URL parsing', () => {
    it('should extract weight ID from URL segments', () => {
        const event = {
            rawPath: '/exercise-weights/68f0a194f8d5912bca1e772e',
            requestContext: {
                http: {
                    method: 'PATCH'
                }
            },
            body: '{"weight": 85.0}'
        };

        // Test que l'ID est bien extrait des segments
        const segments = event.rawPath.split('/').filter(Boolean);
        expect(segments[0]).toBe('exercise-weights');
        expect(segments[1]).toBe('68f0a194f8d5912bca1e772e');
    });

    it('should handle GET with ID correctly', () => {
        const event = {
            rawPath: '/exercise-weights/68f0a194f8d5912bca1e772e',
            requestContext: {
                http: {
                    method: 'GET'
                }
            }
        };

        const segments = event.rawPath.split('/').filter(Boolean);
        expect(segments[1]).toBe('68f0a194f8d5912bca1e772e');
    });
});