"use strict"

CORE.register('sidebar', function(sb) {
	
	return {
		init : function() {
			CORE.start('sidebar:view/buttons/edit/arm')
			CORE.start('sidebar:view/buttons/commit/arm')
		},
		destroy: function() {
			CORE.stop('sidebar:view/buttons/edit/arm')
			CORE.stop('sidebar:view/buttons/commit/arm')			
		}
	}


})

CORE.register('sidebar:view/buttons/edit/arm', function(sb) {
	var $editButton = sb.dom('#editButton'), 
		clicked;
	
	return {
		init: function() {
			sb.listen({
				"(sidebar)view/buttons/edit/on" : this.funcss,
				"(sidebar)view/buttons/edit/off": this.notfuncss
			})

			this.armEditButton()
		},
		destroy: function() {
			sb.ignore({
				"(sidebar)view/buttons/edit/on" : this.funcss,
				"(sidebar)view/buttons/edit/off": this.notfuncss
			})

			this.disarmEditButton()
		},
		armEditButton : function() {
			$editButton.on('click', function() 
			{
				if (!clicked) 
				{
					sb.dispatch('(sidebar)view/buttons/edit/on')
					
					clicked = true
				}
				else 
				{
					sb.dispatch('(sidebar)view/buttons/edit/off')

					clicked = false
				}
			})
		},
		disarmEditButton : function() {
			$editButton.off('click')
			sb.dispatch('(sidebar)view/buttons/edit/off')

		},
		funcss : function() {
			$editButton.css({
				'background-color' 	: '#0CBA41',
				'border'			: 'none',
				'color'				: 'white'
			})
		},
		notfuncss : function() {
			$editButton.css({
				'background-color' 	: null,
				'border'			: null,
				'color'				: null				
			})
		}
	
	}
})
CORE.register('sidebar:view/buttons/commit/arm', function(sb) {
	var	$commitButton = $('#commitButton');

	return {
		init: function() {
			sb.listen({
				"(sidebar)view/buttons/edit/on"  : this.funcss,
				"(sidebar)view/buttons/edit/off" : this.notfuncss
			})

		},
		destroy: function() {
			sb.ignore(["(sidebar)view/buttons/edit/on","(sidebar)view/buttons/edit/off"])
		},
		armCommitButton : function() {

		},
		disarmCommitButton : function() {

		},
		funcss : function() {
			$commitButton.css('display', 'block')
			$commitButton.animate({'opacity' : 1}, 500)
		},
		notfuncss : function() {
			$commitButton.animate({'opacity' : 0}, 500, function() {
				$commitButton.css('display', 'none')
			})
		}
	}
})
