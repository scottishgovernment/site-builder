//var sutPath = '../../../../publishing/format/_handlers/category-list';
var sutPath = '../../../../out/instrument/publishing/format/_handlers/category-list';

var sutClass = require(sutPath);
var sut = new sutClass;
describe('category-list', function() {

    describe('layout', function() {
        function itemWithOneAncestor() {
            return {
                ancestors: [{}]
            };
        }

        function itemWith2AncestorsAnd1AwayFromContent() {

            return {
                ancestors: [{}, {}],

                descendants: [
                    {
                        descendants: [ { navigational: true} ]
                    }
                ]
            }
        }

        function itemWith2AncestorsAnd2AwayFromContent() {

            return {
                ancestors: [{}, {}],

                descendants: [
                    {
                        navigational: true,
                        descendants: [ { navigational: false } ]
                    }
                ]
            }
        }

        function itemWith3AncestorsAndFarAwayFromContent() {

            return {
                ancestors: [{}, {}, {}],

                descendants: [
                    {
                        navigational: true,
                        descendants: [
                            {
                                navigational: true,
                                descendants: [
                                    {
                                        navigational:false
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        }

        function itemWith2AncestorsAndFarAwayFromContent() {

            return {
                ancestors: [{}, {}],

                descendants: [
                    {
                        navigational: true,
                        descendants: [
                            {
                                navigational: true,
                                descendants: [
                                    {
                                        navigational:false
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        }

        function itemWith3AncestorsAndFarAwayFromContent() {

            return {
                ancestors: [{}, {}, []],
                descendants: []
            }
        }

        it('single ancestor -> category-list-1.hbs', function() {

            // ARRANGE
            var input =itemWithOneAncestor();
            var expected = 'category-list-1.hbs';

            // ACT
            var actual = sut.layout(input);

            // ASSERT
            expect(actual).toEqual(expected);
        });

        it('> 1 ancestor, 1 from content -> jumpoff.hbs', function() {

            // ARRANGE
            var input = itemWith2AncestorsAnd1AwayFromContent();
            var expected = 'jumpoff.hbs';

            // ACT
            var actual = sut.layout(input);

            // ASSERT
            expect(actual).toEqual(expected);
        });

        it('> 1 ancestor, 2 from content -> jumpoff-with-sub-categories.hbs', function() {

            // ARRANGE
            var input = itemWith2AncestorsAnd2AwayFromContent();
            var expected = 'jumpoff-with-sub-categories.hbs';

            // ACT
            var actual = sut.layout(input);

            // ASSERT
            expect(actual).toEqual(expected);
        });

        it('3 ancestors, 100 from content -> category-list-2.hbs', function() {

            // ARRANGE
            var input = itemWith3AncestorsAndFarAwayFromContent();
            var expected = 'category-list-2.hbs';

            // ACT
            var actual = sut.layout(input);

            // ASSERT
            expect(actual).toEqual(expected);
        });

        it('2 ancestors, 100 from content -> category-list-2.hbs', function() {

            // ARRANGE
            var input = itemWith2AncestorsAndFarAwayFromContent();
            var expected = 'category-list-2.hbs';

            // ACT
            var actual = sut.layout(input);

            // ASSERT
            expect(actual).toEqual(expected);
        });


        it('3 ancestors, far from content -> category-list-2.hbs', function() {

            // ARRANGE
            var input = itemWith3AncestorsAndFarAwayFromContent();
            var expected = 'category-list-2.hbs';

            // ACT
            var actual = sut.layout(input);

            // ASSERT
            expect(actual).toEqual(expected);
        });

        it('2 ancestors, far from content -> category-list-2.hbs', function() {

            // ARRANGE
            var input = itemWith3AncestorsAndFarAwayFromContent();
            var expected = 'category-list-2.hbs';

            // ACT
            var actual = sut.layout(input);

            // ASSERT
            expect(actual).toEqual(expected);
        });
    });


    describe('prepareForRender', function() {

        function itemWithTweoLevelsOfDescendants() {
            return {
                descendants : [
                    {
                        descendants : [
                            {}, {}, {}
                        ]
                    },
                    {
                        descendants : [
                            {}, {}, {}
                        ]
                    }]
            }
        }

        function numberedItemWithTwoLevelsOfDescendants() {
            return {
                descendants : [
                    {
                        indexInParent: 0,
                        descendants : [
                            { indexInGrandparent: 0 },
                            { indexInGrandparent: 1 },
                            { indexInGrandparent: 2 }
                        ]
                    },
                    {
                        indexInParent: 1,
                        descendants : [
                            { indexInGrandparent: 3 },
                            { indexInGrandparent: 4 },
                            { indexInGrandparent: 5 }
                        ]
                    }]
            }
        }

        it('descendants are numbered', function(done) {

            // ARRANGE
            var input = itemWithTweoLevelsOfDescendants();
            var expected = numberedItemWithTwoLevelsOfDescendants();

            // ACT
            sut.prepareForRender({}, input, function (err, actual) {
                // ASSERT
                expect(actual).toEqual(expected);
                done();
            });
        });
    });
});
