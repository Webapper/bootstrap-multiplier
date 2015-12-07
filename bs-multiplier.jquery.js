/**
 * Created by assarte on 2015.12.06.
 */
+function ($) {
	'use strict';

	// MULTIPLIER PUBLIC CLASS DEFINITION
	// ================================

	/**
	 * @class Multiplier
	 *
	 * @event addnew.bs.multiplier.data-api(event, plugin) Fires when a user action requires adding a new tag
	 *
	 * @param element
	 * @param options
	 * @constructor
	 */
	var Multiplier = function (element, options) {
		var $element = $(element)

		this.$copy         = $element
		this.$parent       = this.$copy.parent()
		this.options       = $.extend({}, Multiplier.DEFAULTS, options)

		var self = this

		this.$parent.addClass('multiplier-parent')

		if (this.options.unwrapParent) {
			this.$copy = this.$copy.children()
			$element.children(':first-child').unwrap()
		}

		if (this.options.addFirst) {
			this.$copy.detach()
			AddNew(self)
		} else {
			ReindexRows(self)
		}

		AddListeners(self)
	}

	Multiplier.VERSION  = '1.0.0'

	Multiplier.DEFAULTS = {
		unwrapParent: false,
		idxPlaceholder: null,
		target: null,
		addFirst: true,
		removeSelector: '[data-toggle="multiplier-remove"]',
		addSelector: '[data-toggle="multiplier-add"]'
	}

	/**
	 * Add new copy
	 * @param {Multiplier} self
	 */
	var AddNew = function(self) {
		var $result = self.$copy.clone()

		if (self.options.target !== null) {
			self.$parent.find(self.options.target).before($result)
		} else {
			self.$parent.append($result)
		}

		$($result[0]).addClass('multiplier-row-first-child')

		setTimeout(function() {
			ReindexRows(self)
			AddListeners(self)
			$result.filter(':first-child').trigger('added.bs.multiplier.data-api', [self, $($result[0]).data('multiplierRow')])
		}, 100)

		return $result
	}

	/**
	 * Reindexing rows
	 * @param {Multiplier} self
	 */
	var ReindexRows = function(self) {
		var $rowsFirstChild = self.$parent.children('.multiplier-row-first-child'),
			index = 0

		$rowsFirstChild.each(function(idx) {
			var $this = $(this),
				indexClass = ''

			if (index == 0) {
				indexClass = 'multiplier-row-first'
			}
			if (index == $rowsFirstChild.length - 1) {
				indexClass += ' multiplier-row-last'
			}
			ReindexElement(self, $this, self.options.idxPlaceholder, index, indexClass)
			index++
		})
	}

	/**
	 * Reindexes an element by given index
	 * @param {Multiplier} self
	 * @param {jQuery} $el
	 * @param {string} placeholder
	 * @param {int} index
	 * @param {string} indexClass
	 */
	var ReindexElement = function(self, $el, placeholder, index, indexClass) {
		var getAllAttr = function($el) {
				var result = {}

				$.each($el.get(0).attributes, function() {
					// this.attributes is not a plain object, but an array
					// of attribute nodes, which contain both the name and value
					if (this.specified && this.name != 'data-idx-placeholder') {
						result[this.name] = this.value
					}
				})

				return result
			},
			change = function($el) {
				var changed = {},
					hasChanged = false

				$.each(getAllAttr($el), function (attr) {
					if (this.indexOf(placeholder) !== -1) {
						changed[attr] = this
						hasChanged = true
						$el.attr(attr, this.replace(placeholder, index.toString()))
					}
				})

				if (hasChanged) {
					$el.data('bs.multiplier.changed', changed)
				} else if (typeof (changed = $el.data('bs.multiplier.changed')) !== 'undefined') {
					$.each(changed, function (attr) {
						$el.attr(attr, this.replace(placeholder, index.toString()))
					})
				}

				$el.children().each(function() { change($(this)) })

				$el.attr('data-multiplier-row', index)
				$el.removeClass('multiplier-row-first multiplier-row-last').addClass(indexClass)
				$el.trigger('reindexed.bs.multiplier.data-api', [self, index])
			},
			$next = $el.next()

		change($el)

		while ($next.length > 0 && !$next.hasClass('multiplier-row-first-child')) {
			change($next)
			$next = $next.next()
		}
	}

	/**
	 * @param {Multiplier} self
	 * @param {int} index
	 */
	var RemoveCopy = function(self, index) {
		self.$parent.find('.multiplier-row-first-child[data-multiplier-row='+index.toString()+']').trigger('removing.bs.multiplier.data-api', [self, index])
		self.$parent.find('[data-multiplier-row='+index.toString()+']').detach()
		ReindexRows(self)
	}

	/**
	 * @param {Multiplier} self
	 */
	var AddListeners = function(self) {
		self.$parent.find(self.options.addSelector).each(function() {
			var $this = $(this)
			if (!$this.data('bs.multiplier.hasClickListener')) {
				$this.on('click.bs.multiplier.data-api', function(e) {
					AddNew(self)
					e.preventDefault()
					e.stopPropagation()
				})
				$this.data('bs.multiplier.hasClickListener', true)
			}
		})
		self.$parent.find(self.options.removeSelector).each(function() {
			var $this = $(this)
			if (!$this.data('bs.multiplier.hasClickListener')) {
				$this.on('click.bs.multiplier.data-api', function(e) {
					RemoveCopy(self, $(this).data('multiplierRow'))
					e.preventDefault()
					e.stopPropagation()
				})
				$this.data('bs.multiplier.hasClickListener', true)
			}
		})
	}

	Multiplier.prototype.AddNew = function() {
		AddNew(this)
	}

	Multiplier.prototype.Remove = function(index) {
		RemoveCopy(this, index)
	}

	// MULTIPLIER PLUGIN DEFINITION
	// ==========================

	function Plugin(option) {
		return this.each(function () {
			var $this   = $(this)
			var data    = $this.data('bs.multiplier')
			var options = $.extend({}, Multiplier.DEFAULTS, $this.data(), typeof option == 'object' && option)

			if (options.idxPlaceholder === null) throw {msg: "Must define idxPlaceholder for multiplying!", target: this}
			if (!data) $this.data('bs.multiplier', (data = new Multiplier(this, options)))
			if (typeof option == 'string') data[option]()
		})
	}

	var old = $.fn.multiplier

	$.fn.multiplier             = Plugin
	$.fn.multiplier.Constructor = Multiplier


	// MULTIPLIER NO CONFLICT
	// ====================

	$.fn.multiplier.noConflict = function () {
		$.fn.multiplier = old
		return this
	}


	// MULTIPLIER DATA-API
	// =================

	$(window).on('load.bs.multiplier.data-api', function (e) {
		$('[data-toggle="multiplier"]').each(function () {
			var $plugin = $(this)
			Plugin.call($plugin, $plugin.data())
		})
	})

}(jQuery);
