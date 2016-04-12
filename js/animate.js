//extend jquery to do the animations

$.fn.extend({
  animateCss: function (animationName) {
		console.log("animating " + $(this).prop("id"));
    var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
    $(this).show().addClass('animated ' + animationName).one(animationEnd, function() {
      $(this).removeClass('animated ' + animationName);
    });
  }
});
