//
//
//     $("#mkform").validate({
//     rules: {
//
//       physics: {
//         required: true,
//         range: [1, 100],
//
//       },
//       chemistry: {
//         required: true,
//       range: [1, 100],
//       },
//       maths: {
//         required: true,
//         range: [1, 100],
//       },
//     },
//     messages: {
//
//      physics: {
//       required: "Please enter marks",
//       range: "marks should be between 1-100",
//      },
//      chemistry: {
//       required: "Please enter marks",
//       range: "marks should be between 1-100",
//      },
//      maths: {
//       required: "Please enter marks",
//       range: "marks should be between 1-100",
//      },
//
//     },
//
//   });
//
//
//
//
// if ($("#mkform").validate()) {
//   $(".cal").click(function(e){
// e.preventDefault();
//     var a=Number($(".ph").val()) ;
//   var b= Number($(".ch").val());
//   var c= Number($(".ma").val());
//   var d = (a+b+c)/3;
//   $(".an").val(d);
//
//   });
//
// }

$("#mkform").submit(function(event){
  console.log("he");
  var a=Number($(".ph").val()) ;
   var b= Number($(".ch").val());
   var c= Number($(".ma").val());
   var d = (a+b+c)/3;
   $(".an").val(d);



});

// $(".dropdown-menu a").click(function(){
//   $(this).parents(".dropdown").find('.btn').html($(this).text() + ' <span class="caret"></span>');
//   $(this).parents(".dropdown").find('.btn').val($(this).data('value'));
// });
$(".d1 .c").click(function(){
  // $(this).parents(".dropdown").find('.btn').html($(this).text() + ' <span class="caret"></span>');
  $('#exampleInput1').val($(this).text());
});
$(".d2 .d").click(function(){
  // $(this).parents(".dropdown").find('.btn').html($(this).text() + ' <span class="caret"></span>');
  $(t2).val($(this).text());
});



// You need to alert if a change happens. Try like so:
//
// $("#sel123").change(function() {
//   alert($(this).find("option:selected").text());
// });
