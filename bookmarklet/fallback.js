/* eslint-env browser */
'use strict';
(function () {
  if (navigator.userAgent.indexOf('MSIE') >= 0 || navigator.userAgent.indexOf('Firefox/3') >= 0) {
    return window.alert('Fallback only works in Chrome, Safari, and Firefox 4 right now. :(\n\nSorry,\n - Mark')
  }

  var $ = {
    memo: {}
  }
  $.each = function (collection, callback) {
    if (!collection) {
      return
    }
    /**
     * ?= BROKEN BEGIN
     * Conformance to
     * https://eslint.org/docs/rules/no-prototype-builtins#rule-details
     * might break functionality
     */
    var hasLengthProperty = Object.prototype.hasOwnProperty.call(collection, 'length')
    if (hasLengthProperty && collection.length === 0) {
      return
    }
    var key
    for (key in collection) {
      var hasKeyProperty = Object.prototype.hasOwnProperty.call(collection, key)
      if (hasKeyProperty && key !== 'length') {
        callback.call(collection, collection[key], key)
      }
    }
    /**
     * ?= BROKEN END
     */
  }

  $.getComputedStyleOfElement = function (elem) {
    if (!elem.tagName) {
      window.alert('WHAT THE FUCK')
      window.bum = elem
      return null
    }

    /**
     *  Based on this blog entry:
     *  http://blog.stchur.com/2006/06/21/css-computed-style/
     */
    if (typeof elem.currentStyle !== 'undefined') {
      return elem.currentStyle
    }

    return document.defaultView.getComputedStyle(elem, null)
  }

  $.trimString = function (string, characterToTrim) {
    characterToTrim = characterToTrim || ' '
    while (string[0] === characterToTrim) {
      string = string.substring(1)
    }
    while (string[string.length - 1] === characterToTrim) {
      string = string.substring(0, string.length - 1)
    }
    return string
  }

  $.unquote = function (string) {
    return $.trimString($.trimString($.trimString(string), '"'), "'")
  }

  $.getFontsFromDeclaration = function (fontDeclaration) {
    if ($.getFontsFromDeclaration.memo[fontDeclaration]) {
      return $.getFontsFromDeclaration.memo[fontDeclaration]
    }

    var fonts = []
    $.each(fontDeclaration.split(','), function (font) {
      fonts.push($.unquote(font))
    })

    $.getFontsFromDeclaration.memo[fontDeclaration] = fonts
    return $.unique(fonts)
  }
  $.getFontsFromDeclaration.memo = {}

  $.getElementFont = function (elem) {
    var style = $.getComputedStyleOfElement(elem) || {}
    if (style['font-family']) {
      return style['font-family']
    } else if (style.fontFamily) {
      return style.fontFamily
    }

    return null
  }

  $.unique = function (array) {
    var uniquedArray = []
    var i
    for (i = 0; i < array.length; i++) {
      if (uniquedArray.indexOf(array[i]) < 0) {
        uniquedArray.push(array[i])
      }
    }
    return uniquedArray
  }

  $.removeBoringFonts = function (allFonts) {
    if (allFonts.length === 0) {
      return allFonts
    }

    var knownBoringFonts = [
      'helvetica',
      'helvetica neue',
      'normal helvetica',
      'lucida grande',
      'tahoma',
      'microsoft sans serif',
      'arial',
      'courier new',
      'times new roman',
      'verdana',
      'courier',
      'geneva',
      'monaco',
      'trebuchet ms',
      'lucida console',
      'comic sans ms',
      'georgia',
      'impact',
      'lucida sans unicode',
      'times',
      'sans serif',
      'serif'
    ]

    var interestingFonts = []
    $.each(allFonts, function (declaration) {
      var fontsInDeclaration = $.getFontsFromDeclaration(declaration)
      if (fontsInDeclaration.length === 0) {
        return
      }

      if (knownBoringFonts.indexOf(fontsInDeclaration[0].toLowerCase()) >= 0) {
        return
      }

      interestingFonts.push(declaration)
    })

    return interestingFonts
  }

  $.getAllFontsInUse = function (elem) {
    var elemFont = $.getElementFont(elem)
    var fonts = elemFont ? [elemFont] : []
    $.each(elem.childNodes, function (childElem) {
      if (!childElem.tagName) {
        return
      }
      fonts = fonts.concat($.getAllFontsInUse(childElem))
    })
    return $.removeBoringFonts($.unique(fonts)).sort()
  }

  $.getClassForFont = function (font) {
    $.memo.getClassForFont = $.memo.getClassForFont || []
    if ($.memo.getClassForFont.length === 0) {
      $.memo.getClassForFont = $.getAllFontsInUse(document.body)
    }

    var index = $.memo.getClassForFont.indexOf(font)
    if (index < 0) {
      return false
    } else {
      return 'fallback-fontclass-' + index
    }
  }

  $.addClassToElement = function (className, element) {
    var elementClassName = className
    if (element.getAttribute('class')) {
      elementClassName = element.getAttribute('class') + ' ' + elementClassName
    }
    element.setAttribute('class', elementClassName)
  }

  $.isClassOnElement = function (className, element) {
    var classes = (element.getAttribute('class') || '').split(' ')
    return (classes.indexOf(className) >= 0)
  }

  $.removeClassFromElement = function (classNameToRemove, element) {
    var elementClassName = ''
    var classes = (element.getAttribute('class') || '').split(' ')
    $.each(classes, function (existingClassName) {
      if (existingClassName !== classNameToRemove) {
        elementClassName += existingClassName + ' '
      }
    })
    element.setAttribute('class', $.trimString(elementClassName))
  }

  $.addFontClasses = function (elem, parentFont) {
    parentFont = parentFont || null
    var font = elem.tagName ? $.getElementFont(elem) : false

    if (elem.getAttribute) {
      var className = false
      if (font) {
        className = $.getClassForFont(font) || false
      }
      if (className) {
        //  Only add the class name if the font is different from the parent element
        //  or if this element explicitly defines the parent's font.
        className = className || 'fallback-fontclass-inherit-parent'
        $.addClassToElement(className, elem)
      }
    }

    $.each(elem.childNodes, function (childElem) {
      $.addFontClasses(childElem, font)
    })
  }

  $.capitalize = function (string) {
    return string.toUpperCase().substring(0, 1) + string.substring(1)
  }

  $.createElementWithContent = function (tagName, content) {
    var elem = document.createElement(tagName)
    elem.innerHTML = content
    return elem
  }

  $.event = function (element, event, handler, capture) {
    capture = capture || false
    var boundHandler = function () {
      return handler.apply(element, arguments)
    }
    element.addEventListener(event, boundHandler, false)
    return boundHandler
  }

  $.setFallbackCSS = function (cssObject) {
    var cssText = ''

    $.each(cssObject, function (declarations, selector) {
      cssText += '#fallback-content-container ' + selector + ' {\n'
      cssText += '  color: magenta !important;\n'
      $.each(declarations, function (value, key) {
        if (key === 'x-more') {
          cssText += '  ' + value + ';\n'
        } else {
          cssText += '  ' + key + ': ' + value + ';\n'
        }
      })
      cssText += '}\n\n'
    })

    var styleElement = document.getElementById('fallback-css')
    if (!styleElement) {
      styleElement = $.createElementWithContent('style', '')
      styleElement.setAttribute('id', 'fallback-css')
      document.body.appendChild(styleElement)
    }

    styleElement.innerHTML = cssText
    window.console.log('Did set' + cssText)
  }

  window.$fallback = $

  $.init = function () {
    if (!window.console || !window.console.log) {
      var console = {
        log: function (message) {
          //  alert(message);
        }
      }
    }

    window.console.log('start')

    var clonedCopy = $.createElementWithContent('div', document.body.innerHTML)
    clonedCopy.setAttribute('id', 'fallback-content-container')

    //  Copy padding. TBD -- give cloned copy negative version of padding as margin
    //  to counteract positioning? Doesn't seem necessary but not sure why.
    var bodyStyle = $.getComputedStyleOfElement(document.body)
    clonedCopy.style.paddingBottom = bodyStyle['padding-bottom'] || 0
    clonedCopy.style.paddingLeft = bodyStyle['padding-left'] || 0
    clonedCopy.style.paddingRight = bodyStyle['padding-right'] || 0
    clonedCopy.style.paddingTop = bodyStyle['padding-top'] || 0

    document.body.appendChild(clonedCopy)
    window.console.log('Added clone')
    $.addFontClasses(clonedCopy)
    window.console.log('Added font classes')

    //  OK, now add the controller
    var controller = $.createElementWithContent('div', '\n<form id="fallback-toggles">\n<h1 id="fallback-title"><abbr title="Fast, flexible font fallback!">fallback!</abbr> <input type="submit" id="fallback-update" value="Update" /></h1>\n<div id="fallback-radios">\n<label><input type="radio" name="fallback-display-mode" accesskey="o" id="fallback-display-mode-original" /> Web font</label>\n<label class="radio-checked"><input type="radio" name="fallback-display-mode" accesskey="b" id="fallback-display-mode-both" checked /> Both</label>\n<label><input type="radio" name="fallback-display-mode" accesskey="f" id="fallback-display-mode-fallback" /> Fallback</label>\n</div>\n<!--<div id="fallback-instructions">Test fallback fonts for each web font declaration.</div-->\n<ul id="fallback-fonts"></ul>\n</form>\n')
    controller.setAttribute('id', 'fallback-controller')
    window.console.log('adding controller')
    document.body.appendChild(controller)
    var fontList = document.getElementById('fallback-fonts')
    fontList.innerHTML = ''

    //  Size the controller
    var resizeController = function () {
      var controller = document.getElementById('fallback-controller')
      var title = document.getElementById('fallback-title')
      var fonts = document.getElementById('fallback-fonts')
      var toggles = document.getElementById('fallback-toggles')

      var maxHeight = controller.offsetHeight - (title.offsetHeight + toggles.offsetHeight)
      fonts.style.maxHeight = maxHeight + 'px'
    }
    $.r = resizeController
    window.addEventListener('resize', resizeController, false)
    resizeController()

    function addRowWithContent (content) {
      var row = $.createElementWithContent('li', content)
      row.setAttribute('class', 'collapsed')

      $.event(row.getElementsByClassName('fallback-disclosure')[0], 'click', function (e) {
        if ($.isClassOnElement('collapsed', row)) {
          $.addClassToElement('expanded', row)
          $.removeClassFromElement('collapsed', row)
        } else {
          $.addClassToElement('collapsed', row)
          $.removeClassFromElement('expanded', row)
        }
        e.preventDefault()
        return false
      })
      $.event(row.getElementsByClassName('fallback-specify-font')[0], 'change', function (e) {
        document.getElementById('fallback-update').click()
      })
      $.event(row.getElementsByClassName('fallback-more-values')[0], 'change', function (e) {
        document.getElementById('fallback-update').click()
      })

      fontList.appendChild(row)

      return row
    }

    var fontClass, row
    $.each($.getAllFontsInUse(document.body), function (font) {
      fontClass = $.getClassForFont(font)
      addRowWithContent('<b>' + font + '</b><input type="text" value="" placeholder="Fallback font" class="fallback-specify-font" data:font-class="' + fontClass + '" /><a href="#" class="fallback-disclosure"><span>&#x25bc;</span></a><textarea class="fallback-more-values" placeholder="e.g. line-height: 1.75 !important;"></textarea>')
    })
    addRowWithContent('<b class="global"><i>Or</i> Set a global fallback</b><input type="text" value="" placeholder="Fallback font" class="fallback-specify-font" data:font-class="*" /><a href="#" class="fallback-disclosure"><span>&#x25bc;</span></a><textarea class="fallback-more-values" placeholder="e.g. line-height: 1.75 !important;"></textarea>')

    $.event(document.getElementById('fallback-display-mode-original'), 'click', function () {
      $.removeClassFromElement('fallback-hide-original', document.body)
      $.addClassToElement('fallback-hide-fallback', document.body)

      $.each(document.getElementsByClassName('radio-checked'), function (elem) {
        $.removeClassFromElement('radio-checked', elem)
      })

      $.addClassToElement('radio-checked', this.parentNode)
      window.console.log(document.body.className)
    })
    $.event(document.getElementById('fallback-display-mode-both'), 'click', function () {
      $.removeClassFromElement('fallback-hide-original', document.body)
      $.removeClassFromElement('fallback-hide-fallback', document.body)
      $.each(document.getElementsByClassName('radio-checked'), function (elem) {
        window.console.log('Oh elem is!', elem)
        $.removeClassFromElement('radio-checked', elem)
      })
      $.addClassToElement('radio-checked', this.parentNode)
      window.console.log(document.body.className)
    })
    $.event(document.getElementById('fallback-display-mode-fallback'), 'click', function () {
      $.addClassToElement('fallback-hide-original', document.body)
      $.removeClassFromElement('fallback-hide-fallback', document.body)
      $.each(document.getElementsByClassName('radio-checked'), function (elem) {
        $.removeClassFromElement('radio-checked', elem)
      })
      $.addClassToElement('radio-checked', this.parentNode)
      window.console.log(document.body.className)
    })

    $.event(document.getElementById('fallback-update'), 'click', function (e) {
      e.preventDefault()

      window.console.log('Updating')

      var cssDeclarations = {}
      $.each(document.getElementsByClassName('fallback-specify-font'), function (fontInput) {
        // var className = fontInput.getAttribute('data:font-class');
        if (!fontInput.getAttribute) {
          return
        }
        var moreTextArea = fontInput.parentNode.getElementsByClassName('fallback-more-values')[0]
        var className = fontInput.getAttribute('data:font-class')
        var selector = (className === '*') ? '*' : ('.' + className)
        var value = $.trimString(fontInput.value)
        var moreValues = $.trimString(moreTextArea.value)
        if (!value && !moreValues) {
          return
        }
        cssDeclarations[selector] = {
          //  TODO: 'font' instead of font-family?
          'font-family': value,
          'x-more': moreValues
        }
      })
      window.console.log(cssDeclarations)
      $.setFallbackCSS(cssDeclarations)
    })
  }

  //  Thanks to Dustin Diaz for this clever hack
  //  http://dustindiaz.com/smallest-domready-ever
  if (/in/.test(document.readyState)) {
    window.addEventListener('load', function () {
      $.init()
    }, false)
  } else {
    $.init()
  }
})()
