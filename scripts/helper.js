$(function(){
        $.ajax({
        url:window.location
    }).done(function(data){
        $("<pre />").appendTo(document.body).text(data).addClass("prettyprint");
         prettyPrint();
    
    
    });
});

