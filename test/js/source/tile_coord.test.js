'use strict';

var test = require('tap').test;
var TileCoord = require('../../../js/source/tile_coord');

test('TileCoord', function(t) {
    t.test('#constructor', function(t) {
        t.ok(new TileCoord(0, 0, 0, 0) instanceof TileCoord, 'creates an object with w');
        t.ok(new TileCoord(0, 0, 0) instanceof TileCoord, 'creates an object without w');
        t.throws(function() {
            /*eslint no-new: 0*/
            new TileCoord(-1, 0, 0, 0);
        }, "Invalid TileCoord object: (-1, 0, 0, 0)", 'detects and throws on invalid input');
        t.end();
    });

    t.test('.id', function(t) {
        t.deepEqual(new TileCoord(0, 0, 0).id, 0);
        t.deepEqual(new TileCoord(1, 0, 0).id, 1);
        t.deepEqual(new TileCoord(1, 1, 0).id, 33);
        t.deepEqual(new TileCoord(1, 1, 1).id, 97);
        t.deepEqual(new TileCoord(1, 1, 1, -1).id, 225);
        t.end();
    });

    t.test('.toString', function(t) {
        t.test('calculates strings', function(t) {
            t.deepEqual(new TileCoord(1, 1, 1).toString(), '1/1/1');
            t.end();
        });

        t.end();
    });

    t.test('.fromID', function(t) {
        t.test('forms a loop', function(t) {
            t.deepEqual(TileCoord.fromID(new TileCoord(1, 1, 1).id), new TileCoord(1, 1, 1));
            t.deepEqual(TileCoord.fromID(0), new TileCoord(0, 0, 0, 0));
            t.end();
        });

        t.end();
    });

    t.test('.url', function(t) {
        t.test('replaces {z}/{x}/{y}', function(t) {
            t.equal(new TileCoord(1, 0, 0).url(['{z}/{x}/{y}.json']), '1/0/0.json');
            t.end();
        });

        t.test('replaces {quadkey}', function(t) {
            t.equal(new TileCoord(1, 0, 0).url(['quadkey={quadkey}']), 'quadkey=0');
            t.equal(new TileCoord(2, 0, 0).url(['quadkey={quadkey}']), 'quadkey=00');
            t.equal(new TileCoord(2, 1, 1).url(['quadkey={quadkey}']), 'quadkey=03');
            t.equal(new TileCoord(17, 22914, 52870).url(['quadkey={quadkey}']), 'quadkey=02301322130000230');

            // Test case confirmed by quadkeytools package
            // https://bitbucket.org/steele/quadkeytools/src/master/test/quadkey.js?fileviewer=file-view-default#quadkey.js-57
            t.equal(new TileCoord(6, 29, 3).url(['quadkey={quadkey}']), 'quadkey=011123');

            t.end();
        });

        t.test('replaces {bbox-epsg-3857}', function(t) {
            t.equal(new TileCoord(1, 0, 0).url(['bbox={bbox-epsg-3857}']), 'bbox=-20037508.342789244,0,0,20037508.342789244');
            t.end();
        });

        t.end();
    });

    t.test('.children', function(t) {
        t.deepEqual(new TileCoord(0, 0, 0).children(),
            [ 1, 33, 65, 97 ].map(TileCoord.fromID));
        t.end();
    });

    t.test('.parent', function(t) {
        t.test('returns a parent id', function(t) {
            t.equal(TileCoord.fromID(33).parent().id, 0);
            t.end();
        });

        t.test('returns null for z0', function(t) {
            t.equal(TileCoord.fromID(0).parent(), null);
            t.equal(TileCoord.fromID(32).parent(), null);
            t.end();
        });

        t.end();
    });

    t.test('.cover', function(t) {
        t.test('calculates tile coverage at w = 0', function(t) {
            var z = 2,
                coords = [
                    {column: 0, row: 1, zoom: 2},
                    {column: 1, row: 1, zoom: 2},
                    {column: 1, row: 2, zoom: 2},
                    {column: 0, row: 2, zoom: 2}
                ],
                res = TileCoord.cover(z, coords, z);
            t.deepEqual(res, [{id: 130, w: 0, x: 0, y: 1, z: 2, posMatrix: null}]);
            t.end();
        });

        t.test('calculates tile coverage at w > 0', function(t) {
            var z = 2,
                coords = [
                    {column: 12, row: 1, zoom: 2},
                    {column: 13, row: 1, zoom: 2},
                    {column: 13, row: 2, zoom: 2},
                    {column: 12, row: 2, zoom: 2}
                ],
                res = TileCoord.cover(z, coords, z);
            t.deepEqual(res, [{id: 3202, w: 3, x: 0, y: 1, z: 2, posMatrix: null}]);
            t.end();
        });

        t.test('calculates tile coverage at w = -1', function(t) {
            var z = 2,
                coords = [
                    {column: -1, row: 1, zoom: 2},
                    {column:  0, row: 1, zoom: 2},
                    {column:  0, row: 2, zoom: 2},
                    {column: -1, row: 2, zoom: 2}
                ],
                res = TileCoord.cover(z, coords, z);
            t.deepEqual(res, [{id: 738, w: -1, x: 3, y: 1, z: 2, posMatrix: null}]);
            t.end();
        });

        t.test('calculates tile coverage at w < -1', function(t) {
            var z = 2,
                coords = [
                    {column: -13, row: 1, zoom: 2},
                    {column: -12, row: 1, zoom: 2},
                    {column: -12, row: 2, zoom: 2},
                    {column: -13, row: 2, zoom: 2}
                ],
                res = TileCoord.cover(z, coords, z);
            t.deepEqual(res, [{id: 3810, w: -4, x: 3, y: 1, z: 2, posMatrix: null}]);
            t.end();
        });

        t.test('calculates tile coverage across meridian', function(t) {
            var z = 2,
                coords = [
                    {column: -0.5, row: 1, zoom: 2},
                    {column:  0.5, row: 1, zoom: 2},
                    {column:  0.5, row: 2, zoom: 2},
                    {column: -0.5, row: 2, zoom: 2}
                ],
                res = TileCoord.cover(z, coords, z);
            t.deepEqual(res, [
                {id: 130, w: 0, x: 0, y: 1, z: 2, posMatrix: null},
                {id: 738, w: -1, x: 3, y: 1, z: 2, posMatrix: null}]);
            t.end();
        });

        t.end();
    });

    t.end();
});
