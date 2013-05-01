/**
 * __          __   _ _   _                  _
 * \ \        / /  (_) | | |                | |
 *  \ \  /\  / / __ _| |_| |__    _ __   ___| |_
 *   \ \/  \/ / '__| | __| '_ \  | '_ \ / _ \ __|
 *    \  /\  /| |  | | |_| | | |_| | | |  __/ |_
 *     \/  \/ |_|  |_|\__|_| |_(_)_| |_|\___|\__|
 *
 *
 * @package     roll20
 * @subpackage  D&D 4th Edition Framework
 *
 * Copyright (C) 2013 Kevin Kragenbrink
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

/***************************************
 * CONFIGURATION SETTINGS
 ***************************************/
var CONFIG = {
    /** Hit Points **/
    HP_ATTRIBUTE                        : 'Hit Points',
    HP_BAR                              : 1,

    /** Temporary Hit Points **/
    THP_ATTRIBUTE                       : 'Temporary Hit Points',
    THP_BAR                             : 3,

    /** Initiative **/
    INIT_ATTRIBUTE                      : 'Initiative',

    /** Log Output **/
    DEBUG                               : true,
    ERROR                               : true,
    NOTICE                              : true,
    WARN                                : true,

    /** Networking **/
    LATENCY                             : 10 /* Milliseconds */
};

/***************************************
 * CONSTANTS
 ***************************************/
var HP_BAR_VALUE                        = ['bar',   CONFIG.HP_BAR,  '_value'].join('');
var HP_BAR_MAX                          = ['bar',   CONFIG.HP_BAR,  '_max'  ].join('');
var HP_BAR_LINK                         = ['_bar',  CONFIG.HP_BAR,  '_link' ].join('');

var THP_BAR_VALUE                       = ['bar',   CONFIG.THP_BAR, '_value'].join('');
var THP_BAR_MAX                         = ['bar',   CONFIG.THP_BAR, '_max'  ].join('');
var THP_BAR_LINK                        = ['_bar',  CONFIG.THP_BAR, '_link' ].join('');

/***************************************
 * UTILITIES
 ***************************************/

/**
 * Formats a string for printing.
 *
 * @name    debug
 * @param   {Mixed[]}       {...}
 * @return  {Void}
 */
var formatRegexp                        = /%[sdj%]/g;
var format = function (f) {
    var args                            = Array.prototype.slice.call(arguments, 0);
    var argl                            = args.length;

    if (typeof f !== 'string') {
        var objects                     = [];
        while (argl--) {
            objects.push(args[i].toString());
        }

        return objects.join(' ');
    }

    var i                               = 1;
    var str = String(f).replace(formatRegexp, function (x) {
        if (x === '%%') return '%';
        if (i >= args) return x;
        switch (x) {
            case '%s' : return String(args[i++]);
            case '%d' : return Number(args[i++]);
            case '%j' : return JSON.stringify(args[i++]);
            default:
                return x;
        }
    });

    for (var x = args[i]; i < argl; x = args[++i]) {
        if (x === null || typeof x !== 'object') {
            str                         += ' ' + x;
        }
        else {
            str                         += ' ' + x.toString();
        }
    }

    return str;
};

/***************************************
 * LOGS
 ***************************************/
var debug = function () {
    if (CONFIG.DEBUG) {
        var args                        = Array.prototype.slice.call(arguments, 0);
        var message                     = args.shift();
            message                     = format('[DEBUG] %s', message);
        args.unshift(message);
        log(format.apply(null, args));
    }
};

var error = function () {
    if (CONFIG.ERROR) {
        var args                        = Array.prototype.slice.call(arguments, 0);
        var message                     = args.shift();
            message                     = format('[ERROR] %s', message);
        args.unshift(message);
        log(format.apply(null, args));
    }
};

var notice = function () {
    if (CONFIG.NOTICE) {
        var args                        = Array.prototype.slice.call(arguments, 0);
        var message                     = args.shift();
            message                     = format('[NOTICE] %s', message);
        args.unshift(message);
        log(format.apply(null, args));
    }
};

var warn = function () {
    if (CONFIG.WARN) {
        var args                        = Array.prototype.slice.call(arguments, 0);
        var message                     = args.shift();
            message                     = format('[WARN] %s', message);
        args.unshift(message);
        log(format.apply(null, args));
    }
};

/***************************************
 * VALIDATORS
 ***************************************/

/**
 * Determines whether a token currently has temporary hit points.
 */
var hasTHP = function (token) {
    debug('hasTHP');

    var thpbar                          = parseInt(token.get(THP_BAR_VALUE));
    return (thpbar !== NaN && thpbar > 0);

    // TODO: Check the sheet for a THP Attribute, if no bar exists.
};

/**
 * Detects whether a change to a token impacts its hit point bar.
 *
 * @name    isHPChange
 * @param   {Graphic}       token
 * @param   {Object}        previous
 * @return  {Boolean}
 */
var isHPChange = function (token, previous) {
    debug('isHPChange');
    return (token.get(HP_BAR_VALUE) !== previous[HP_BAR_VALUE]);
};

/**
 * Detects whether a change to a token impacts its temporary hit point bar.
 *
 * @name    isTHPChange
 * @param   {Graphic}       token
 * @param   {Object}        previous
 * @return  {Boolean}
 */
var isTHPChange = function (token, previous) {
    debug('isTHPChange');
    return (token.get(THP_BAR_VALUE) !== previous[THP_BAR_VALUE]);
};


/***************************************
 * MODEL CHANGERS
 ***************************************/

/**
 * Sets the value of a 'Bar' on a token.
 *
 * TODO: There is an ugly race condition in setting bar values, at the moment.
 *       The setTimeout circumvents the race condition, but is incredibly
 *       hackish and should be removed when the race condition is resolved.
 *
 * @name    setBar
 * @param   {Graphic}       token
 * @param   {Int}           bar
 * @param   {Number}        value
 * @return  {Void}
 */
var setBar = function (token, bar, value) {setTimeout(function() {
    debug('setBar (%s, %d, %d)', token.get('_id'), bar, value);

    if (parseInt(bar) !== bar || typeof value !== 'number') {
        warn('Could not adjust bar; invalid bar or value.');
        return;
    }

    var link                            = token.get(['_bar', bar, '_link'].join(''));

    if (link !== '') {
        var attr                        = findObjs({_type : 'attribute', _id : link});

        if (attr.length === 1) {
            attr[0].set({current : value});
        }
        else {
            warn('Could not find associated attribute for bar "%s" on token "%s".', bar, obj.get('_id'));
        }
    }
    token.set(['bar', bar, '_value'].join(''), value);

}, CONFIG.LATENCY)};


/***************************************
 * COMMAND HANDLERS
 ***************************************/
var commands                            = {};

/***************************************
 * CHANGE HANDLERS
 ***************************************/

/**
 * Manually manages hit point changes, to account for temporary hit points.
 *
 * @name    handleHPChange
 * @param   {Graphic}       token
 * @param   {Object}        old
 * @return  {Void}
 */
var changeHP = function (token, old) {
    var current                         = parseInt(token.get(HP_BAR_VALUE));
    var previous                        = parseInt(old[HP_BAR_VALUE]);
    var thp                             = parseInt(token.get(THP_BAR_VALUE));

    debug('handleHPChange (%s, %d, %d, %d)', old._id, current, previous, thp);

    if (current === NaN || previous === NaN) { return; }

    // We only need to worry about THP if current is less than previous and we have THP.
    if (thp > 0 && current < previous) {
        var change                      = current - previous;
        current                         = (thp + change >= 0) ? previous : (previous + thp + change);
        thp                             = (thp + change >= 0) ? (thp + change) : 0;

        setBar(token, CONFIG.HP_BAR, current);
        setBar(token, CONFIG.THP_BAR, thp);

        // TODO: If there is no bar, we may still have THP in Attributes on
        //       the Character which need changing.
    }
};

/**
 * Manually handles THP changes, to ensure only the highest value is kept.
 *
 * @name    handleTHPChange
 * @param   {Graphic}       token
 * @param   {Object}        old
 * @return  {Void}
 */
var changeTHP = function (token, old) {
    var current                         = parseInt(token.get(THP_BAR_VALUE));
    var previous                        = parseInt(old[THP_BAR_VALUE]);

    debug('handleTHPChange (%s, %d, %d)', old._id, current, previous);

    if (current === NaN || previous === NaN) { return; }

    // We really only care to compare when both are there.
    if (current > 0 && previous > 0) {
        var thp                         = (current > previous) ? current : previous;
        setBar(token, CONFIG.THP_BAR, thp);
    }
};

/***************************************
 * TRIGGERS
 ***************************************/

/**
 * Generic token change handler which delegates events to other handlers.
 *
 * @name    onChangeToken
 * @param   {Graphic}       token
 * @param   {Object}        previous
 * @return  {Void}
 */
on('change:token', function (token, previous) {
    debug('onChangeToken (%s)', previous._id);

    if (isHPChange(token, previous) && hasTHP(token)) { changeHP(token, previous); }
    if (isTHPChange(token, previous) && hasTHP(token)) { changeTHP(token, previous); }
});

/**
 * Generic chat message handler which delegates to other handlers.
 *
 * @name    onChatMessage
 * @param   {Message}       message
 * @return  {Void}
 */
on('chat:message', function (message) {
    debug('onChatMessage (%s)', message.type);

    // We only care about API messages, right now.
    if (message.type !== 'api') { return; }

    var args                            = {};
    var words                           = message.content.split(' ');
    var command                         = words.shift().substr(1).toLowerCase();
    var argl                            = args.length;
    var word;

    while (word = words.shift()) {
        if (word.substr(0, 2) == '--') {
            var arg                         = word.substring(2, word.indexOf('='));
            var value                       = true;
            if (word.indexOf('=') !== -1) {
                value                       = word.substr(word.indexOf('=') + 1);
            }

            args[arg]                       = value;
        }
        else {
            words.unshift(word);
            break;
        }
    }
    var content                         = words.join(' ');

    if (typeof commands[command] === 'function') {
        commands[command].call(null, args, content, message);
    }
    else {
        warn('Attempted to call invalid command "%s".', command);
    }
});
