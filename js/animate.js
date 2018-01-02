//extend jquery to do the animations

$.fn.extend({
  animex: function (animationName,delay) {
		//We're no longer respecting the delay, if we ever were,
		//but if it's 0 or not there it means no animation was intended.
		
		//console.log("animating " + $(this).prop("id"));
    var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
		if (animationName == "fadeIn") {
			if (!delay)
				$(this).show();
			else
				$(this).removeClass(animationName).show().addClass(animationName).one(animationEnd, function() {
					$(this).removeClass(animationName);
				});
		} else if (animationName == "fadeOut") {
			if (!delay)
				$(this).hide();
			else
				$(this).removeClass(animationName).addClass(animationName).one(animationEnd, function() {
					$(this).removeClass(animationName).hide();
				});
		}
  }
});
