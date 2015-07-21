var sut = require('../../out/instrument/item-formatter')();

describe('item-formatter', function() {

    it('org_list reformatted to include descendants grouped by first letter and sector', function() {

        var input = {
            "uuid": "itemid",
            "contentItem": {
                "slug": "slug",
                "url": "/url/",
                "title": "item",
                "_embedded": {
                    "format": { "name": "ORG_LIST"}
                },
                "summary": "item"
            },
            "descendants": [
                {
                    "id": "id1",
                    "url": "/apple/",
                    "slug": "apple",
                    "title": "Apple",
                    "summary": "Apple summary",
                    "descendants": [],
                    "sector": "Sector One",
                    "sectorDescription": "Sector One Description"
                },
                {
                    "id": "id2",
                    "slug": "ant",
                    "url": "/ant/",
                    "title": "ant",
                    "summary": "ant summary",
                    "descendants": [],
                    "sector": "Sector One",
                    "sectorDescription": "Sector One Description"
                },
                {
                    "id": "id3",
                    "slug": "zebra",
                    "url": "/zebra/",
                    "title": "zebra",
                    "summary": "zebra summary",
                    "descendants": [],
                    "sector": "Sector Two",
                    "sectorDescription": "Sector Two Description"
                }
            ]
        };
        var expected = {
                "uuid": "itemid",
                "contentItem": {
                    "slug": "slug",
                    "url": "/url/",
                    "title": "item",
                    "_embedded": {
                        "format": { "name" : "org_list"},
                    },
                    "summary": "item"
                },
                "descendants": [
                    {
                        "id": "id1",
                        "url": "/apple/",
                        "slug": "apple",
                        "title": "Apple",
                        "summary": "Apple summary",
                        "descendants": [],
                        "sector": "Sector One",
                        "sectorDescription": "Sector One Description"
                    },
                    {
                        "id": "id2",
                        "slug": "ant",
                        "url": "/ant/",
                        "title": "ant",
                        "summary": "ant summary",
                        "descendants": [],
                        "sector": "Sector One",
                        "sectorDescription": "Sector One Description"
                    },
                    {
                        "id": "id3",
                        "slug": "zebra",
                        "url": "/zebra/",
                        "title": "zebra",
                        "summary": "zebra summary",
                        "descendants": [],
                        "sector": "Sector Two",
                        "sectorDescription": "Sector Two Description"
                    }
                ],
                layout : "org-list.hbs",
                "descendantsByFirstLetter": [
                    {
                        "letter": "a",
                        "items": [
                            {
                                "id": "id1",
                                "url": "/apple/",
                                "slug": "apple",
                                "title": "Apple",
                                "summary": "Apple summary",
                                "descendants": [],
                                "sector": "Sector One",
                                "sectorDescription": "Sector One Description"
                            },
                            {
                                "id": "id2",
                                "slug": "ant",
                                "url": "/ant/",
                                "title": "ant",
                                "summary": "ant summary",
                                "descendants": [],
                                "sector": "Sector One",
                                "sectorDescription": "Sector One Description"
                            }
                        ]
                    },
                    {
                        "letter": "z",
                        "items": [
                            {
                                "id": "id3",
                                "slug": "zebra",
                                "url": "/zebra/",
                                "title": "zebra",
                                "summary": "zebra summary",
                                "descendants": [],
                                "sector": "Sector Two",
                                "sectorDescription": "Sector Two Description"
                            }
                        ]
                    }
                ],
                "descendantsBySector": [
                    {
                        "sector": "Sector One",
                        "sectorDescription": "Sector One Description",
                        "sectorCount": 2,
                        
                        "items": [
                            {
                                "id": "id1",
                                "url": "/apple/",
                                "slug": "apple",
                                "title": "Apple",
                                "summary": "Apple summary",
                                "descendants": [],
                                "sector": "Sector One",
                                "sectorDescription": "Sector One Description"
                            },
                            {
                                "id": "id2",
                                "slug": "ant",
                                "url": "/ant/",
                                "title": "ant",
                                "summary": "ant summary",
                                "descendants": [],
                                "sector": "Sector One",
                                "sectorDescription": "Sector One Description"
                            }
                        ]
                    },
                    {
                        "sector": "Sector Two",
                        "sectorDescription": "Sector Two Description",
                        "sectorCount": 1,
                        "items": [
                            {
                                "id": "id3",
                                "slug": "zebra",
                                "url": "/zebra/",
                                "title": "zebra",
                                "summary": "zebra summary",
                                "descendants": [],
                                "sector": "Sector Two",
                                "sectorDescription": "Sector Two Description"
                            }
                        ]
                    }
                ]
            };
        var actual = sut.format(input);
        expect(actual.descendantsByFirstLetter).toEqual(expected.descendantsByFirstLetter);
        expect(actual.descendantsBySector).toEqual(expected.descendantsBySector);
    });

    it('correct layout assigned to non-category lists', function() {
        var input = {
            "contentItem": {
                "title": "title",                
                "_embedded": {
                    "format": { "name": "MADE_UP_FORMAT"}
                }
            }
        };
        var expectedLayout = "made-up-format.hbs"

        var actual = sut.format(input);
        expect(actual.layout).toEqual(expectedLayout);
    });

    it('correct layout assigned to category list with 1 ancestor', function() {
        var input = {
            "contentItem": {
                "title": "title",
                "_embedded": {
                    "format": { "name": "CATEGORY_LIST"}
                }
            },
            ancestors: [{}]
        };
        var expectedLayout = "category-list-1.hbs"
        var actual = sut.format(input);
        expect(actual.layout).toEqual(expectedLayout);
    });

    it('correct layout assigned to category list with 3 ancestors', function() {
        var input = {
            "contentItem": {
                "title": "title",
                "_embedded": {
                    "format": { "name": "CATEGORY_LIST"}
                }
            },
            ancestors: [{}, {}, {}]
        };
        var expectedLayout = "category-list-3.hbs"
        var actual = sut.format(input);
        expect(actual.layout).toEqual(expectedLayout);
    });

    it('correct layout assigned to category list with 5 ancestors', function() {
        // if there are more than 4 ancestors then default to category-list-2.hbs
        var input = {
            "contentItem": {
                "title": "title",
                "_embedded": {
                    "format": { "name": "CATEGORY_LIST"}
                }
            },
            ancestors: [{}, {}, {}, {}, {}]
        };
        var expectedLayout = "category-list-2.hbs"
        var actual = sut.format(input);
        expect(actual.layout).toEqual(expectedLayout);
    });

    it('la service finder descendant sorted by service provider', function() {
        
        var input = {
            "contentItem": {
                "title": "title",
                "_embedded": {
                    "format": { "name": "LA_SERVICE_FINDER"}
                }
            },
            ancestors: [],
            descendants : [
                {
                    serviceProvider: 'zzz'
                },
                {
                    serviceProvider: 'aaa'
                },
                {
                    serviceProvider: 'aaa'
                },
                {
                    serviceProvider: 'bbb'
                },
            ]

        };
        var expectedDescendants = [
            {serviceProvider : 'aaa'}, {serviceProvider : 'aaa'}, 
            {serviceProvider : 'bbb'}, {serviceProvider: 'zzz'}
        ];
        var actual = sut.format(input);
        expect(actual.descendants).toEqual(expectedDescendants);
    });

    it('links are redacted', function() {
        // if there are more than 4 ancestors then default to category-list-2.hbs
        var input = {
            "contentItem": {
                "title": "title",
                "_embedded": {
                    "format": { "name": "CATEGORY_LIST"},
                    "links": "embedded links"
                },
                "links": "links"
            },
            ancestors: [{}, {}, {}, {}, {}]
        };
        
        var actual = sut.format(input);
        expect(actual.contentItem.links).not.toBeDefined(); 
        expect(actual.contentItem._embedded.links).not.toBeDefined();
    });
});
