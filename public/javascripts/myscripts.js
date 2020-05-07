var chat_app = angular.module('chatterBox', []);

chat_app.controller('chatterBoxController', function($scope, $http,$filter,$interval,$timeout){

// The load function when the page is first loaded
$scope.load = function(){
 $http.get("/chats/load").then(function(response){
 	if(response.data.msg===''){ //login already 
 	$scope.login=true;
 	$scope.ready=false;
 	$scope.loginInfo = response.data;
 	}
 	else {$scope.login=false; //have not login yet
 		  $scope.ready=true;
 		  $scope.ShowConversation = false;
 		  $scope.chosen = null;
 		  $scope.loginInfo = response.data;
 	}
 }, function(response){
 	alert("Error getting user:"+response.data.msg);
 });
};

// login function
$scope.UserInfo = {userName:"", password:""};
$scope.loginB = function(userinfo){
 if(userinfo.userName==''||userinfo.password==''){
 alert("You must enter username and password");
 return;
 }
 $http.post("/chats/login", userinfo).then(function(response){
 if(response.data.msg==='Login Failure'){
 return;
 }
 else{
 $scope.login=false;
 $scope.ready=true;
 $scope.loginInfo = response.data;
 }
 }, function(response){
 alert("Error when Login:"+response.statusText);
 });
};

$scope.logout = function(){
 $http.get("/chats/logout").then(function(response){
 	if(response.data.msg===''){ // logout success; reset all the things
 	$scope.login=true;
 	$scope.ready=false;
 	$scope.chosen = null;
 	$scope.ShowConversation = false;
  $scope.ShowUserInfo = false;
 	$scope.currentConversation = '';
  $scope.loginInfo = null;
  $scope.UserDetail = null;
 	}
 	else {$scope.login=false;
 		  $scope.ready=true;
 	}
 }, function(response){
 	alert("wow fail to logout");
 });

};

// function for getting info for userinfo page.
$scope.getuserinfo = function(){
 $http.get("/chats/getuserinfo").then(function(response){
 	if(response.data.msg===''){
 	$scope.ShowUserInfo = true;
 	$scope.ShowConversation = false;
 	$scope.UserDetail = response.data;
 	$scope.currentConversation = '';
  $scope.chosen = null;
 	}
 }, function(response){
 	alert("Error getting user:"+response.data.msg);
 });
};

// To save changed userinfo
$scope.saveuserinfo = function(userdetail){
 $http.put("/chats/saveuserinfo", userdetail).then(function(response){
 if(response.data.msg===''){
 $scope.getuserinfo(); // refresh the userinfo page
 }
 else{
 alert("Error saving userinfo:"+response.data.msg);
 }
 }, function(response){
 alert("*Error saving userinfo :"+response.statusText);
 });
};

//changing button color
$scope.chosen = null;
$scope.chooseButton= function(index){
	$scope.chosen = index;
};
$scope.currentConversation='';
//loading message of specific friend
$scope.getconversation = function(id){
 var url = '/chats/getconversation/'+id;
 $scope.currentConversation=id;
 $http.get(url).then(function(response){
 	$scope.ShowUserInfo = false;
 	$scope.ShowConversation = true;
  $scope.scrollChecker = true;

var messages = response.data.messages;
 	$scope.id_list = new Array();
 	messages.forEach(function(value,i){	
 		$scope.id_list[i] = value._id;
 	});

 	$scope.ConversationInfo = response.data;
  $scope.toBottom();
 }, function(response){
 	alert("Error getting conversation:"+response.data.msg);
 });
};

// for showing the newest message first when the conversation is loaded
$scope.toBottom = function(){
	var objDiv = document.getElementById("innerBox");
	$timeout(function(){
			var objDiv = document.getElementById("innerBox");
            objDiv.scrollTop = objDiv.scrollHeight;
			
        }, 100);
	
};

//The post message function
$scope.msgBox ={message:'Type a message here', date:'', time:''}
$scope.postmessage = function(newMsg){
if($scope.msgBox.message!=''){
var date = new Date()

newMsg.time = $filter('date')(date, 'HH:mm:ss');
newMsg.date = $filter('date')(date, 'EEE MMM dd yyyy');
var url = "chats/postmessage/"+$scope.currentConversation;
 $http.post(url, newMsg).then(function(response){
 if(response.data._id != null){
 $scope.msgBox.message='Type a message here';
 $scope.newestMessageId = response.data._id;
 }
 }, function(response){
 alert("Error when post message:"+response.statusText);
 });
}
}

//delete message
$scope.deletemessage = function(id){
// Pop up a confirmation dialog
var confirmation = confirm('Delete the message?');
// Check and make sure the deletion confirmed
if (confirmation === true) {
 var url = '/chats/deletemessage/'+id;
 $http.delete(url).then(function(response){
 return;
 }, function(response){
 alert("Error deleting Message:"+response.statusText);
 });
 }
 else {
 // If they said no to the confirm, do nothing
 return false;
 }
};

//periodical update
//GET request for http://localhost:3000/getnewmessages/:friendid
$scope.getnewconversation = function(id){
 var url = '/chats/getnewmessages/'+id;
 $http.get(url).then(function(response){
 	$scope.ConversationInfo.status = response.data.status;
 	$scope.id_list = response.data.id_list;
 	var newConversation = response.data.messages;
 	newConversation.forEach(function(value,i){	
 		if($scope.ConversationInfo.messages.includes(value)==false){
 		$scope.ConversationInfo.messages.push(value);
 	}
 	});
 	
 }, function(response){
 	alert("Error getting New conversation:"+response.data.msg);
 });
};

 //AJAX HTTP GET request for http://localhost:3000/getnewmsgnum/:friendid
 $scope.getnewmsgnum = function(id){
 var url = '/chats/getnewmsgnum/'+id;
 $http.get(url).then(function(response){
 	var index;
 	$scope.loginInfo.friends_id.forEach(function(value,i){	
 		if(value == id){
 			index = i;
 		}
 	$scope.loginInfo.unread_no[index] = response.data.unread_no;
 	});
 	
 }, function(response){
 	alert("Error getting New msgNum:"+response.data.msg);
 });
};

//for refreshing current conversation
$interval(function () {
if($scope.currentConversation != ''){
$scope.getnewconversation($scope.currentConversation);
}

}, 1000);


// For getting msg number
$interval(function () {
if($scope.ready==true){
$scope.loginInfo.friends_id.forEach(function(value,i){
	if($scope.currentConversation != value){
	$scope.getnewmsgnum(value);
}
});
}
}, 1000);


});


//directive used for the enter function
chat_app.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });
 
                event.preventDefault();
            }
        });
    };
});






