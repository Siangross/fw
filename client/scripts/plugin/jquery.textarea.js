
(function ($) {
    $.fn.tabby = function (options) {
        var opts = $.extend({}, $.fn.tabby.defaults, options);
        var pressed = $.fn.tabby.pressed;
        return this.each(function () {
            $this = $(this);
            var options = $.meta ? $.extend({}, opts, $this.data()) : opts;
            $this.bind("keydown", function (e) {
                var kc = $.fn.tabby.catch_kc(e);
                if (16 == kc) {
                    pressed.shft = true;
                }
                if (17 == kc) {
                    pressed.ctrl = true;
                    setTimeout("$.fn.tabby.pressed.ctrl = false;", 1000);
                }
                if (18 == kc) {
                    pressed.alt = true;
                    setTimeout("$.fn.tabby.pressed.alt = false;", 1000);
                }
                if (9 == kc && !pressed.ctrl && !pressed.alt) {
                    e.preventDefault;
                    pressed.last = kc;
                    setTimeout("$.fn.tabby.pressed.last = null;", 0);
                    process_keypress($(e.target).get(0), pressed.shft, options);
                    return false;
                }
            }).bind("keyup", function (e) {
                if (16 == $.fn.tabby.catch_kc(e)) {
                    pressed.shft = false;
                }
            }).bind("blur", function (e) {
                if (9 == pressed.last) {
                    $(e.target).one("focus", function (e) {
                        pressed.last = null;
                    }).get(0).focus();
                }
            });
        });
    };
    $.fn.tabby.catch_kc = function (e) {
        return e.keyCode ? e.keyCode : e.charCode ? e.charCode : e.which;
    };
    $.fn.tabby.pressed = {shft:false, ctrl:false, alt:false, last:null};
    function debug($obj) {
        if (window.console && window.console.log) {
            window.console.log("textarea count: " + $obj.size());
        }
    }
    function process_keypress(o, shft, options) {
        var scrollTo = o.scrollTop;
        if (o.setSelectionRange) {
            gecko_tab(o, shft, options);
        } else {
            if (document.selection) {
                ie_tab(o, shft, options);
            }
        }
        o.scrollTop = scrollTo;
    }
    $.fn.tabby.defaults = {tabString:String.fromCharCode(9)};
    function gecko_tab(o, shft, options) {
        var ss = o.selectionStart;
        var es = o.selectionEnd;
        if (ss == es) {
            if (shft) {
                if ("\t" == o.value.substring(ss - options.tabString.length, ss)) {
                    o.value = o.value.substring(0, ss - options.tabString.length) + o.value.substring(ss);
                    o.focus();
                    o.setSelectionRange(ss - options.tabString.length, ss - options.tabString.length);
                } else {
                    if ("\t" == o.value.substring(ss, ss + options.tabString.length)) {
                        o.value = o.value.substring(0, ss) + o.value.substring(ss + options.tabString.length);
                        o.focus();
                        o.setSelectionRange(ss, ss);
                    }
                }
            } else {
                o.value = o.value.substring(0, ss) + options.tabString + o.value.substring(ss);
                o.focus();
                o.setSelectionRange(ss + options.tabString.length, ss + options.tabString.length);
            }
        } else {
            var lines = o.value.split("\n");
            var indices = new Array();
            var sl = 0;
            var el = 0;
            var sel = false;
            for (var i in lines) {
                el = sl + lines[i].length;
                indices.push({start:sl, end:el, selected:(sl <= ss && el > ss) || (el >= es && sl < es) || (sl > ss && el < es)});
                sl = el + 1;
            }
            var modifier = 0;
            for (var i in indices) {
                if (indices[i].selected) {
                    var pos = indices[i].start + modifier;
                    if (shft && options.tabString == o.value.substring(pos, pos + options.tabString.length)) {
                        o.value = o.value.substring(0, pos) + o.value.substring(pos + options.tabString.length);
                        modifier -= options.tabString.length;
                    } else {
                        if (!shft) {
                            o.value = o.value.substring(0, pos) + options.tabString + o.value.substring(pos);
                            modifier += options.tabString.length;
                        }
                    }
                }
            }
            o.focus();
            var ns = ss + ((modifier > 0) ? options.tabString.length : (modifier < 0) ? -options.tabString.length : 0);
            var ne = es + modifier;
            o.setSelectionRange(ns, ne);
        }
    }
    function ie_tab(o, shft, options) {
        var range = document.selection.createRange();
        if (o == range.parentElement()) {
            if ("" == range.text) {
                if (shft) {
                    var bookmark = range.getBookmark();
                    range.moveStart("character", -options.tabString.length);
                    if (options.tabString == range.text) {
                        range.text = "";
                    } else {
                        range.moveToBookmark(bookmark);
                        range.moveEnd("character", options.tabString.length);
                        if (options.tabString == range.text) {
                            range.text = "";
                        }
                    }
                    range.collapse(true);
                    range.select();
                } else {
                    range.text = options.tabString;
                    range.collapse(false);
                    range.select();
                }
            } else {
                var selection_text = range.text;
                var selection_len = selection_text.length;
                var selection_arr = selection_text.split("\r\n");
                var before_range = document.body.createTextRange();
                before_range.moveToElementText(o);
                before_range.setEndPoint("EndToStart", range);
                var before_text = before_range.text;
                var before_arr = before_text.split("\r\n");
                var before_len = before_text.length;
                var after_range = document.body.createTextRange();
                after_range.moveToElementText(o);
                after_range.setEndPoint("StartToEnd", range);
                var after_text = after_range.text;
                var end_range = document.body.createTextRange();
                end_range.moveToElementText(o);
                end_range.setEndPoint("StartToEnd", before_range);
                var end_text = end_range.text;
                var check_html = $(o).html();
                $("#r3").text(before_len + " + " + selection_len + " + " + after_text.length + " = " + check_html.length);
                if ((before_len + end_text.length) < check_html.length) {
                    before_arr.push("");
                    before_len += 2;
                    if (shft && options.tabString == selection_arr[0].substring(0, options.tabString.length)) {
                        selection_arr[0] = selection_arr[0].substring(options.tabString.length);
                    } else {
                        if (!shft) {
                            selection_arr[0] = options.tabString + selection_arr[0];
                        }
                    }
                } else {
                    if (shft && options.tabString == before_arr[before_arr.length - 1].substring(0, options.tabString.length)) {
                        before_arr[before_arr.length - 1] = before_arr[before_arr.length - 1].substring(options.tabString.length);
                    } else {
                        if (!shft) {
                            before_arr[before_arr.length - 1] = options.tabString + before_arr[before_arr.length - 1];
                        }
                    }
                }
                for (var i = 1; i < selection_arr.length; i++) {
                    if (shft && options.tabString == selection_arr[i].substring(0, options.tabString.length)) {
                        selection_arr[i] = selection_arr[i].substring(options.tabString.length);
                    } else {
                        if (!shft) {
                            selection_arr[i] = options.tabString + selection_arr[i];
                        }
                    }
                }
                if (1 == before_arr.length && 0 == before_len) {
                    if (shft && options.tabString == selection_arr[0].substring(0, options.tabString.length)) {
                        selection_arr[0] = selection_arr[0].substring(options.tabString.length);
                    } else {
                        if (!shft) {
                            selection_arr[0] = options.tabString + selection_arr[0];
                        }
                    }
                }
                if ((before_len + selection_len + after_text.length) < check_html.length) {
                    selection_arr.push("");
                    selection_len += 2;
                }
                before_range.text = before_arr.join("\r\n");
                range.text = selection_arr.join("\r\n");
                var new_range = document.body.createTextRange();
                new_range.moveToElementText(o);
                if (0 < before_len) {
                    new_range.setEndPoint("StartToEnd", before_range);
                } else {
                    new_range.setEndPoint("StartToStart", before_range);
                }
                new_range.setEndPoint("EndToEnd", range);
                new_range.select();
            }
        }
    }
})(jQuery);

