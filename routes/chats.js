var express = require('express');
var router = express.Router();
var session = require('express-session');
var ObjectID = require('mongodb').ObjectID;


router.use(session({secret:'random_string_goes_here',
                    resave: false,
                    saveUninitialized: false
            }));



/* Check the session */
router.get('/load', function(req, res) {
  if(req.session.userId){ // when session is set already
  console.log(req.session.userId);
	var db = req.db;
 	var collection = db.get('userList');
 	var collection1 = db.get('messageList');
 	collection.find({'_id':req.session.userId},{'name':1,'_id':0,'friends':1,'icon':1},function(err,docs){
 		if(err === null){
 			var myName = docs[0].name;
 			var friends = docs[0].friends; // with friends[i].name & friends[i].lastMsgId
 			var icon = docs[0].icon;
 			var friends_id = new Array();
 			var unread_no = new Array();
      var loopCounter = 0;
 			friends.forEach(function(value,i){
 			collection.find({'name':value.name},{'_id':1},function(err0,docs0){
 				if(err0 === null){
 					friends_id[i]=docs0[0]._id;
          var senderId = ObjectID(docs0[0]._id).toString();
          var receiverId = ObjectID(req.session.userId).toString();
 					collection1.find({_id:{$gt: value.lastMsgId},'senderId' : senderId,'receiverId' :receiverId},function(err1,docs1){
 					if(err1 === null){
 					unread_no[i]=docs1.length;
          loopCounter++;
 					if(loopCounter === friends.length){ // end when all loop is done
            console.log('END SOON');
 						res.json(
 						{
 					'name':myName,
          'userId':req.session.userId,
 					'icon':icon,
 					'friends':friends,
 					'friends_id':friends_id,
 					'unread_no':unread_no
 						}

 						);
 					}
 					}
 					else {
 						res.send(
 						{ msg: err1 }
 						);
 					}
 					});

 				}
 				else {
 					res.send(
 					{ msg: err0 }
 					);
 				}
 			});
 			});
 			
 		}
 		else {
 			res.send(
 					{ msg: err }
 					);
 			}
 	});
  }else{
  	res.send( // when session is not set
  		{msg: ''}
  		);
  	}
});

/* login */
router.post('/login',function(req, res) {
  console.log('inside post')
	var db = req.db;
 	var collection = db.get('userList');
 	var collection1 = db.get('messageList');
 	var username = req.body.userName;
 	var password = req.body.password;
 	var filter={"name": username,"password": password};
 	collection.find(filter,function(l_err,l_docs){
 		if(l_err === null){ 
 			if(l_docs.length === 0){ // no matched item
 				res.send(
 				{msg: 'Login Failure'}
 					);
 			}
 	else { // there is match item
 	collection.find({'name':username},{'name':1,'_id':1,'friends':1,'icon':1},function(err,docs){
    console.log('First suceed');
 		if(err === null){
      console.log('First real sucess');
 			var myName = docs[0].name;
 			var id = docs[0]._id;
 			var friends = docs[0].friends; // with friends[i].name & friends[i].lastMsgId
 			var icon = docs[0].icon;
 			var friends_id = [];
 			var unread_no = new Array();
      var loopCounter = 0; // for controlling the forEach
 			friends.forEach(function(value,i){
 			collection.find({'name':value.name},{'_id':1},function(err0,docs0){
 				if(err0== null){
 					friends_id[i]=docs0[0]._id;
        
          var senderId = ObjectID(docs0[0]._id).toString();
          var receiverId = ObjectID(docs[0]._id).toString();
 					collection1.find({_id:{$gt: value.lastMsgId},'senderId' : senderId,'receiverId' : receiverId},function(err1,docs1){
 					if(err1 === null){
 					unread_no[i]=docs1.length;
          loopCounter++;
           if(loopCounter == friends.length){ // end when all loop is done
          // add the session variable userId
          req.session.userId = id;
          // to update the status
          var u_filter = {'_id':id};
          collection.update(u_filter,{$set : {'status' : 'online'}},function(u_err, result){
            if(u_err === null){
              res.json(
                {
                'name':myName,
                'userId':req.session.userId,
                'icon':icon,
                'friends':friends,
                'friends_id':friends_id,
                'unread_no':unread_no
                }

                );
            }
            else {
              res.send(
              { msg: u_err +'UPDATE'}
              );
              }
            });
          }
 					
 					}
 					else {
 						res.send(
 						{ msg: err1 +'find NO'}
 						);
 					}
 					});

 				}
 				else {
          console.log('err0 not OK');
 					res.send(
 					{ msg: err0 +'findFriends' }
 					);
 				}
 			});
 			});
 			
 		}
 		else {
 			res.send(
 					{ msg: err +'First'}
 					);
 			}
 	});
}
}
else {
	res.send(
 			{ msg: l_err +'CANNOT LOGIN' }
 			);
 			}
});
});



/* HTTP GET requests for http://localhost:3000/logout */
router.get('/logout', function(req, res) {
 var db = req.db;
 var collection = db.get('userList');
 var filter = {'_id' : req.session.userId};
 collection.update(filter,{$set : {'status' : 'offline'}},function(err,docs){
 if (err === null){
 req.session.userId = null; // delete the session variable
 res.send({msg:''}); // send empty message for successful logout
}
 else res.send({msg: err });
 });
});

/*HTTP GET requests for http://localhost:3000/getuserinfo. */
router.get('/getuserinfo', function(req, res) {
 var db = req.db;
 var collection = db.get('userList');
 var filter = {'_id' : req.session.userId};
 var field = {'mobileNumber':1, 'homeNumber':1, 'address':1 }
 collection.find(filter,field,function(err,docs){
 if (err === null){
 var mn = docs[0].mobileNumber;
 var hm = docs[0].homeNumber;
 var add = docs[0].address;
 res.json({
 	'mobileNumber' : mn,
 	'homeNumber' : hm,
 	'address' : add,
  'msg': ''
 });
}
 else res.send({msg: err });
 });
});

/*  HTTP PUT requests for http://localhost:3000/saveuserinfo.  */
router.put('/saveuserinfo', function(req, res) {
 var db = req.db;
 var collection = db.get('userList');
 var mn =req.body.mobileNumber;
 var hn = req.body.homeNumber;
 var add = req.body.address
 console.log(mn);
 console.log(req.session.userId);
 var filter={"_id": req.session.userId};
 collection.update(filter,{$set : {mobileNumber: mn, homeNumber: hn, address: add}},function(err, result){
 res.send(
(err === null) ? { msg: '' } : { msg: err } // set empty msg for successful update
 );
 });
});

/* HTTP GET requests for http://localhost:3000/getconversation/:friendid */
router.get('/getconversation/:friendid', function(req, res) {
 var db = req.db;
 var collection = db.get('userList');
 var collection1 = db.get('messageList');
 var friendToShow = req.params.friendid;

 collection.find({'_id': friendToShow},{'status':1, 'icon':1,'name':1},function(err,docs){
 	if(err === null){ // get all basic info 1st
 		var status = docs[0].status;
 		var icon = docs[0].icon;
 		var f_name = docs[0].name;


 		var filter = {'senderId' : {$in:[req.session.userId, friendToShow]},'receiverId' : {$in:[req.session.userId, friendToShow]}};
 		collection1.find(filter,function(err1,docs1){ // find the related msg
 			if(err1 === null){
 			var msg = docs1;
      if(docs1.length>0){
 			var lmId = docs1[docs1.length-1]._id;}
      else {
        lmId = '0'; // if there is no message, just leave it to be 0
      }
 			collection.update({'_id' : req.session.userId, "friends.name" : f_name},{$set : {"friends.$.lastMsgId" : lmId }},function(err, result){
 				if(err === null){ // update the corresponding lastMsgId and send the data back to front end
 					res.json(
 						{
              'name' : f_name,
 							'icon' : icon,
 							'status' : status,
 							'messages' : msg
 						}

 						);
 				}
 				else {
 					res.send({msg: err });
 				}
 			});
 		}
 		else {
 			res.send({msg: err1 });
 		}
 		});

 		}

 	else res.send({msg:err});
 });
});

/*  HTTP POST requests for http://localhost:3000/postmessage/:friendid */
router.post('/postmessage/:friendid',function(req,res){
	var db = req.db;
 	var collection = db.get('messageList');
 	var senderId = req.session.userId;
 	var receiverId = req.params.friendid;
 	var message = req.body.message;
 	var date = req.body.date;
 	var time = req.body.time;
 	var content = {senderId : senderId, receiverId : receiverId, message : message, date : date, time : time};
 	collection.insert(content, function(err, result){
 		res.send(
		(err === null) ? { _id: content._id } : { msg: err } //send the _id of new message in success
 		);
 	});
 	

});


/*  HTTP DELETE requests for http://localhost:3000/deletemessage/:msgid */
router.delete('/deletemessage/:msgid', function(req, res) {
 var db = req.db;
 var collection = db.get('messageList');
 var collection1 = db.get('userList');
 var messageToDelete = req.params.msgid;
 collection.find({_id: messageToDelete}, {fields: {receiverId:1, senderId:1}},function(err, results) {
   var friendid = new ObjectID(results[0].receiverId);
   collection1.find({_id : req.session.userId},{fields: {name : 1}},function(errn,docsn){
    var myName = docsn[0].name;
    collection1.find({_id: friendid, 'friends.name': myName},{fields: {'friends.$.lastMsgId' : 1}},function(err1,docs1){
      var FriendOfFriend = docs1[0].friends;
      var current_lmid = FriendOfFriend[0].lastMsgId;
      if(current_lmid == messageToDelete){
        var filter = {_id:{$lt: new ObjectID(messageToDelete)},'senderId' : {$in:[results[0].receiverId, results[0].senderId]},'receiverId' : {$in:[results[0].receiverId,results[0].senderId]}};
        collection.find(filter,function(err2,docs2){
          var NewLmId = docs2[docs2.length-1]._id;
          collection1.update({'_id' : friendid, "friends.lastMsgId" : ObjectID(messageToDelete)},{$set : {"friends.$.lastMsgId" : NewLmId }},function(erru,resultu){
        // remove msg after updating the lastMsgId of friend
        collection.remove({'_id':messageToDelete},function(err){

      res.send((err===null)?{msg:''}:{msg:'error:'+err});
      });
      });
        });

      }
      else{ // delete directly if that is not the last msg.
        collection.remove({'_id':messageToDelete},function(err){

        res.send((err===null)?{msg:''}:{msg:'err:'+err});
        });
      }

    });
   });
});
 
});

/*  HTTP GET requests for http://localhost:3000/getnewmessages/:friendid */
router.get('/getnewmessages/:friendid', function(req, res) {
 var db = req.db;
 var collection = db.get('userList');
 var collection1 = db.get('messageList');
 var friendToShow = req.params.friendid;
 var senderId = ObjectID(friendToShow).toString();
 var receiverId = ObjectID(req.session.userId).toString();
collection.find({_id:friendToShow},{fields:{name:1 , status:1}},function(err,docs){
if(err === null){
//inner start
var friendName = docs[0].name;
var myStatus = docs[0].status;
collection.find({_id: req.session.userId, 'friends.name' : friendName},{fields:{'friends.$.lastMsgId' : 1}},function(err1,docs1){
  if (err1 === null){
  var myFriend = docs1[0].friends;
  var lmId = myFriend[0].lastMsgId;
  var filter = {'senderId' : {$in:[senderId, receiverId]},'receiverId' : {$in:[senderId, receiverId]}};
  collection1.find(filter,function(err2,docs2){
    if(err2 === null){
      var id_list = new Array(); //getting the existing messageID
      if(docs2.length>0){
          var NewlmId = docs2[docs2.length-1]._id; // getting the new lastMsgId
        }
          else {
            NewlmId = '0'; // set to 0 if no message left
          }
      docs2.forEach(function(value,i){
        id_list[i] = docs2[i]._id; //the id_list if existing msg
      });

      var filter2 = {_id:{$gt: lmId},'senderId' : {$in:[senderId, receiverId]},'receiverId' : {$in:[senderId, receiverId]}};
      collection1.find(filter2,function(err3,docs3){
        if(err3 === null){
          var msg = docs3; // the new msg to add to the conversation
          console.log(docs3);
          
            collection.update({'_id' : req.session.userId, "friends.name" : friendName},{$set : {"friends.$.lastMsgId" : NewlmId }},function(err4, result){
        if(err4 === null){
          res.json(
            {
              'id_list':id_list,
              'status' : myStatus,
              'messages' : msg
            }

            );
        }
        else {
          res.send({msg: err4 });
        }
      });

        }
        else {
          res.send({msg: err3 });
        }
      });

    }
    else{
      res.send({msg: err2 });
    }
  });
}
else{
  res.send({msg: err1 });
}
});
 		
 	// inner end
 }
 else{
 	res.send({msg: err });
 }
 });
});

/* HTTP GET requests for http://localhost:3000/getnewmsgnum/:friendid */
router.get('/getnewmsgnum/:friendid', function(req, res) {
 var db = req.db;
 var collection = db.get('userList');
 var collection1 = db.get('messageList');
 var friendToShow = req.params.friendid;
 var senderId = ObjectID(friendToShow).toString();
 var receiverId = ObjectID(req.session.userId).toString();
 var filter_n = {_id: friendToShow};
 var field_n = {fields:{name:1}};
 collection.find(filter_n,field_n,function(errn,docsn){
  if(errn === null){
    var FriendName = docsn[0].name;
    var filter = {_id: req.session.userId, 'friends.name' : FriendName};
    var field ={fields:{'friends.$.lastMsgId' : 1}};
 collection.find(filter,field,function(err,docs){
 	if(err === null){
    var myFriend = docs[0].friends;
 		var lastId = myFriend[0].lastMsgId;
 		var filter1 = {'senderId' : senderId,'receiverId' : receiverId, _id:{$gt: lastId}};
 		collection1.find(filter1,function(err1,docs1){
 			if(err1 === null){
 				var number = docs1.length; // count the unread msg
 				res.json(
 						{
 							'unread_no' : number
 						}

 						);
 			}
 			else {
 				res.send({msg: err1 });
 			}
 		});
 	}
 	else {
 		res.send({msg: err });
 	}
 });
}
  else{
    res.send({msg: errn });
  }
});

 });

module.exports = router;
