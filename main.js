var keymove=0;
var gmove=0;
var gsize=0;
$(document).ready(function() {
	var mapcircle=0;
	var maptarget=null;
	var mapposx=null,mapposy=null;
	var mapposcx=null,mapposcy=null;
	var circlept=0;
	var defaultProfile=0;
	var profileIndex=defaultProfile;
	var gTmpArr={};
	var historyName='mm8hist';
	let profSym='@g=';
	var preId='mapoint';
	
	//загрузка истории
	var globhist=getCookie(historyName);
	try {
		//globhist=[];
		globhist = JSON.parse(globhist);
		//Если история есть заполняем группу история всеми элементами.
		//console.log(globhist);
		//loadhist(); !!! история загружается в другом месте
	}
	catch(e) {
		//console.log(e); // error in the above string (in this case, yes)!
		console.log('Данных истории в куках нет');
		globhist=[];
		
	}
	if (globhist===null){
		console.log('История не существует');
		globhist=[];
	}
	init();
	
	function init(){
		//Выводим группы
		$('#flyProf .list-group-item').not('.custom').remove();
		$('#flyProf .mainfly').append(wrapGroups());
		
		profileSelect(defaultProfile);
	}
	function wrapGroups(active=0){
		
		var countpta=Profiles.length;
		var tmpGroup=$('#tmpGroup');
		var newel=tmpGroup.html();
		var newgroups=$('');
		
		for (i=0;i<countpta;i++){
			let newhtml=$($.parseHTML( jQuery.trim(newel.replace(/#text#/gi, Profiles[i].Name)))).data('id',i);
			if (active==i){
				newgroups=newgroups.add(newhtml.addClass('active'));
			}
			else
			{
				newgroups=newgroups.add(newhtml);
			}
		}
		return newgroups;
	}
	
	$('#flyProf').on('click','.list-group-item:not(.custom)',function(){
		var el=$(this);
		var sibs=el.parent().find('.list-group-item');
		sibs.removeClass('active');
		el.addClass('active');
		
		profileIndex=sibs.index(el);
		profileSelect(profileIndex);
	})
	
	function profileSelect(num){
		//var index=$('#flyProf .list-group-item').eq('num').data('id');
		var zoom=1;
		
		if (typeof(Profiles[num].zoom)!=undefined){
			zoom=Profiles[num].zoom;
		}
		
		$('#mainpic').find('img').attr('src',Profiles[num].File).end().css({'transform':'scale('+zoom+')'});
		pointsarr=self[Profiles[num].pointarr];
		//Смена индекса точек
		if (Profiles[num].StartIndex>0){
			ChangePointIdex(Profiles[num].StartIndex);
		}
		
		
		$('#mainpic').css('left',Profiles[num].offsetLeft);
		$('#mainpic').css('top',Profiles[num].offsetTop);
		$('.maingroups .list-group-item').remove();
		$('.maingroups').append($(Profiles[num].GpoupList));
		
		
		//замена точек 
		$('#mainpic .mycircle').remove();
		//заполнение списков
		fillGroupsList();
		
		//Пересчет кол-ва точек в группе
		UpdateCountGr();
		
		
		//Уменьшаем значки
		$('.mycircle').css({'transform':'scale('+1/zoom+')'});
		
		
		//Закрыть все группы
		closeGroups();
		//Подгрузка истории
		if (globhist){loadhist();}
		
	};
	function UpdateCountGr(group=null){
		let cnt;
		let elemText;
		let preg=/\(\d*\)/;
		let curElem;
		if (group!==null){
			curElem=$('.maingroups .list-group-item').eq(group)
			cnt=curElem.find('.list-group-item-text.active').length;
			elemText=curElem.find('.list-group-item-heading .text').html();
			if (elemText.match(preg)){
				elemText=elemText.replace(preg,'('+cnt+')');
			}
			else
			{
				elemText+=' ('+cnt+')';
			}
			curElem.find('.list-group-item-heading .text').html(elemText);
		}
		else{
			//все группы
			let i=0;
			$('.maingroups .list-group-item').not('.autohist').each(function(){
				UpdateCountGr(i);
				i++;
			});
		}
	}
	function ChangePointIdex(StartIndex){
		if (StartIndex){
			var countpta=pointsarr.length;
			
			for (i=0;i<countpta;i++){
				pointsarr[i].PointIndex=StartIndex+i;
			}
		}
	}
	function fillGroupsList(){
		var countpta=pointsarr.length;
		var group;
		var gcnt;
		var numi;
		
		for (i=0;i<countpta;i++){
			group=JSON.parse(pointsarr[i].Groups);
			gcnt=group.length;
			
			if (typeof(pointsarr[i].PointIndex)!='undefined'){
				numi=pointsarr[i].PointIndex;
			}
			else
			{
				numi= i;
			}
			
			if (gcnt>0){
				//Раньше, когда проект создавался, предполагалось что у каждой точки(кнопки может быть несколько групп)
				for (z=0;z<gcnt;z++){
					placelisttext(group[z],pointsarr[i].Name,numi)
				}
			}
			placebtn(pointsarr[i].CoordX,pointsarr[i].CoordY,numi,pointsarr[i].Name,1,group[0]);
		}
	}
	function closeGroups(){
		$('#flylist .list-group-item').each(function(){
			var par=$(this);
			var el=par.find('.text');
			el.addClass('closed');
			//closed
			//close
			par.find('.list-group-item-text').addClass('hide');
			
		});
	}
	
	function loadhist(){
		var tmplist=$('#tmplist');
		var tmparr;
		
		var tmpcnt=globhist.length;
		var groupnum;
		for (var i=0;i<tmpcnt;i++){
			var newid=globhist[i];
			if (newid.indexOf(profSym)){
				//история содержит группы, в старых версиях не содержит
				tmparr=newid.split(profSym);
				newid=tmparr[0];
				profileCurrent=tmparr[1];
			}
			else{
				profileCurrent=null;
			}
			//globhist.push(dataid+profSym+groupnum);
			var newel=tmplist.html();
			//у нас есть id - берем с маркеров на карте описания
			newel = $($.parseHTML( jQuery.trim(newel.replace(/#text#/gi, $('#'+newid).attr('title')))));
			newel.data('id',newid);
			if (profileCurrent!==null){
				newel.data('prof',profileCurrent);
			}
			if (groupnum){newel.data('group',groupnum);}
			newel.append($('<span class="icondel"></span>'));
			$('#flylist .autohist').append(newel);
		}
	}
	
	function placelisttext(groupnum,text,numpoint,setActive=0,setHide=0){
		var flylist=$('#flylist');
		var tmplist=$('#tmplist');
		var newel=tmplist.html();
		newel = $.parseHTML( jQuery.trim(newel.replace(/#text#/gi, text+' ('+numpoint+')')));
		newel=$(newel);
		newel.data('id',preId+numpoint);
		newel.data('group',groupnum);
		//тяжелый но нужный метод для быстрого поиска
		//$(newel).attr('data-textid', preId+numpoint);
		
		if (setActive){newel.addClass('active');}
		if (setHide){newel.addClass('hide');}
		flylist.find('.list-group-item').eq(groupnum).append(newel);
	}
	
	function placebtn(x,y,num,tname,thide=1,onegroup){
		var tmpbtn=$('#tmpbtn');
		var mainpic=$('#mainpic');
		var newel=tmpbtn.html();
		newel = $.parseHTML( jQuery.trim(newel.replace(/#number#/gi, num)));
		$(newel).css({'left':x,'top':y})
		$(newel).attr('id',  preId+num );
		$(newel).attr('title',  tname );
		$(newel).addClass('cg'+onegroup);
		if (thide){
			$(newel).addClass('hide');
		}
		
		mainpic.append(newel);
	}
	
	$('#flylist > .container > h2').dblclick(function(event){
		var curtext='',alton=0;
		if (event.altKey){
			//console.log('alt');
			//собираем оставшиеся активные элементы
			alton=1;
		}
		//массив соответствий группы и ид
		var arrgroup={};
		
		var flylist;
		var cntgroups=$('#flylist .list-group-item').not('.autohist').length;
		var groupi=0;
		for (groupi=0;groupi<cntgroups;groupi++){
			
			flylist=$('#flylist .list-group-item:eq('+groupi+') .list-group-item-text');
			flylist.each(function(){arrgroup[$(this).data('id')] = groupi;});
			
		}
		
		if (alton){
			//попробовать не flylist на по порядку сдедования, попробовать сразу по маркерам пройтись
			flylist=$('#mainpic .mycircle:not(.hide)');
			flylist.each(function(){
				//$('#mainpic .mycircle:not(.hide)').eq(0).get(0).id
				var newid=this.id;
				//var elemmap=$('#'+newid);
				var elemmap=$(this);
				
				curtext=curtext+'{'+"\n";
				curtext=curtext+"'Name':'"+elemmap.attr('title')+"',"+"\n";
				curtext=curtext+"'CoordX':'"+elemmap.css('left')+"',"+"\n";
				curtext=curtext+"'CoordY':'"+elemmap.css('top')+"',"+"\n";
				curtext=curtext+"'Groups':'"+"["+arrgroup[newid]+"]',"+"\n";
				curtext=curtext+'},'+"\n";
			});
		}
		else
		{
			//выжимка из истории
			var tmpcnt=globhist.length;
			var tmparr;
			for (var i=0;i<tmpcnt;i++){
				var newid=globhist[i];
				if (newid.indexOf(profSym)){
					//история содержит группы, в старых версиях не содержит
					tmparr=newid.split(profSym);
					newid=tmparr[0];
					//groupnum=tmparr[1];
					}/*else{
					groupnum=null;
				}*/
				var elemmap=$('#'+newid);
				//у нас есть id - берем с маркеров на карте описания
				
				curtext=curtext+'{'+"\n";
				curtext=curtext+"'Name':'"+elemmap.attr('title')+"',"+"\n";
				curtext=curtext+"'CoordX':'"+elemmap.css('left')+"',"+"\n";
				curtext=curtext+"'CoordY':'"+elemmap.css('top')+"',"+"\n";
				curtext=curtext+"'Groups':'"+"["+arrgroup[newid]+"]',"+"\n";
				curtext=curtext+'},'+"\n";
			}
		}
		curtext='var pointsarr=['+"\n"+curtext+']';
		//console.log(curtext);
		navigator.clipboard.writeText(curtext).then(response => {
			console.log('ok');
		}
		).catch(e => {
			console.log(e);
		});
		return false;
	});
	$('body').keypress(function(event){
		if (circlept){
			//console.log(event.keyCode);
			if (event.keyCode==91 || event.keyCode==1093){
				//minus
				//console.log('minus');
				if (maptarget){
					maptarget.width(parseInt(maptarget.width())-10);
					maptarget.height(parseInt(maptarget.height())-10);
				}
			}
			else if (event.keyCode==93 || event.keyCode==1098){
				//plus
				//console.log('plus');
				maptarget.width(parseInt(maptarget.width())+10);
				maptarget.height(parseInt(maptarget.height())+10);
			}
		}
		else{
			/*if (event.keyCode==103 || event.keyCode==1087){
				var el=$('.gmove');
				if (el.hasClass('active')){
				gmove=0;
				}
				else
				{
				gmove=1;
				}
				$('.gmove').toggleClass('active');
				}
				if (event.keyCode==122 || event.keyCode==1103){
				var el=$('.gsize');
				if (el.hasClass('active')){
				gsize=0;
				}
				else
				{
				gsize=1;
				}
				$('.gsize').toggleClass('active');
			}*/
			//console.log(event.keyCode);
		}
	})
	$('#mainpic').on('contextmenu','.mycircle',function(event){
		//контент
		$('#flycMenu').removeClass('hide').css({'left':event.clientX,'top':event.clientY}).data(preId,event.target.id);
		$('#flycMenu').on('click',function(){$(this).addClass('hide')});
		
		event.preventDefault();
	})
	$('#flycMenu .list-group-item-text').on('click',(event)=>{
		let zobj=event.target.dataset.action;
		if ($(event.target).hasClass('active')){
			$(event.target).removeClass('active');
			if (zobj){
				//keymove=0;
				self[zobj]=0;
			}
		}
		else
		{
			$(event.target).addClass('active');
			if (zobj){
				//keymove=1;
				self[zobj]=1;
			}
		}
	})
	$(document).on('keydown',function(event){
		//if you're using jQuery, you can reliably use which as jQuery
		//var x = event.which || event.keyCode;
		switch(event.which){
			case 37:
			//left
			if (keymove){
				let obj=$('#'+$('#flycMenu').data(preId));
				let objleft=parseInt(obj.css('left'));
				if (objleft>0){
					obj.css('left',(objleft-1)+'px');
				}
			}
			break;
			case 38:
			//up
			if (keymove){
				let obj=$('#'+$('#flycMenu').data(preId));
				let objtop=parseInt(obj.css('top'));
				if (objtop>0){
					obj.css('top',(objtop-1)+'px');
				}
			}			
			break;
			case 39:
			//right
			if (keymove){
				let obj=$('#'+$('#flycMenu').data(preId));
				let objleft=parseInt(obj.css('left'));
				if (objleft<document.body.clientWidth){
					obj.css('left',(objleft+1)+'px');
				}
			}
			break;
			case 40:
			//down
			if (keymove){
				let obj=$('#'+$('#flycMenu').data(preId));
				let objtop=parseInt(obj.css('top'));
				if (objtop<document.body.clientHeight){
					obj.css('top',(objtop+1)+'px');
				}
			}			
			break;
		}
		
	})
	
	$('#mainpic').mousedown(function(event){
		$('#flycMenu').addClass('hide');
		//console.log(event);
		if (event.target.className.indexOf('mycircle')>=0){mapcircle=1;}
		if (event.shiftKey && mapcircle==1){
			//хотим изменить маркер
			
			//старый номер группы
			var numi=$(event.target).attr('id').replace( /[^\d]/g, "" );
			var tmpGroup=numi-1;
			//ищем его в pointsarr по номеру и от туда берем номер группы
			try {
				tmpGroup=$.parseJSON(pointsarr[tmpGroup].Groups);
				tmpGroup=(tmpGroup.length)?tmpGroup[0]:0;
			}
			catch(e) {
				console.log('Не удалось определить группу');
				tmpGroup=0;
			}
			
			var desc = prompt("Описание:", event.target.title);
			//Задел на будущее
			//var group = prompt("Номер группы:", tmpGroup);
			//тут надо удалить старый элемент в списке flylist и добавить новый в другую группу но с тем же номером
			//if (desc != null && group != null ) {
			//placelisttext(group,desc,numi,1,1);
			//и удалить старую
			/*
				узнаем номер
				flylist=$('#flylist .list-group-item .list-group-item-text');
				flylist.each(function(){
				if ($(this).data('id')==newid){
				//нашли
				$(this).remove();
				}
				});
				
			*/
			//UpdateCountGr(group);			
			if (desc != null) {
				event.target.title=desc;
			}
		}
		if (event.ctrlKey){
			//console.log(event);
			//activate circlept
			if (circlept){
				circlept=0;
				maptarget.toggleClass('active');
				
				maptarget=null;
				mapposx=null;
			}
			else
			{
				circlept=1;
				maptarget=$('.objcirclept');
				maptarget.toggleClass('active');
				//console.log('down ctrl act='+maptarget.hasClass('active'));
			}
		}
		el=$(this);
		el.addClass('active');
		if (mapcircle==1){el=$(event.target);maptarget=el;}
		
		mapposx=parseInt(event.pageX);
		mapposy=parseInt(event.pageY);
		mapposcx=parseInt(el.css('left'));
		mapposcy=parseInt(el.css('top'));
		if (circlept){
			mapposcx=parseInt(event.pageX);
			mapposcy=parseInt(event.pageY);
		}
		if (gmove || gsize){
			if (mapcircle){
				//запоминаем все старые координаты
				gTmpArr={};
				$('#mainpic .mycircle').each(function(){
					let tmpel=$(this);
					gTmpArr[tmpel.attr('id')]={'left':parseInt(tmpel.css('left')),'top':parseInt(tmpel.css('top'))};
				});
				//console.log(gTmpArr);
			}
		}
		
		return false;
	});
	$('#body').ondragstart = function() {
		return false;
	};	
	$('#mainpic').ondragstart = function() {
		return false;
	};	
	$('body').mouseup(function(event){
		//console.log('mouseup');
		$('#mainpic').removeClass('active');
		
		if (event.altKey && mapcircle==1){
			var oldx,oldy;
			if (mapposx!=null){
				//запоминаем новые координаты
				oldx=parseInt(maptarget.css('left'));
				oldy=parseInt(maptarget.css('top'));
				//возвращаем старые координаты
				maptarget.css('left',mapposcx+'px');
				maptarget.css('top',mapposcy+'px');
			}
			//хотим продублировать метку
			//старый номер группы
			var tmpGroup=maptarget.attr('id').replace( /[^\d]/g, "" );
			tmpGroup=tmpGroup-1;
			//ищем его в pointsarr по номеру и от туда берем номер группы
			try {
				tmpGroup=$.parseJSON(pointsarr[tmpGroup].Groups);
				tmpGroup=(tmpGroup.length)?tmpGroup[0]:0;
			}
			catch(e) {
				console.log('Не удалось определить группу');
				tmpGroup=0;
			}
			
			
			var desc = prompt("Описание:", maptarget.attr('title'));
			var group = prompt("Номер группы:", tmpGroup);
			if (desc != null && group != null ) {
				//Новый номер
				var numi=$('#mainpic .mycircle').length;
				
				//не с 0
				if (Profiles[profileIndex].StartIndex>0){
					numi+=Profiles[profileIndex].StartIndex;
				}
				
				pointsarr.push({'Name':desc,'CoordX':oldx,'CoordY':oldy,'Groups':'['+group+']'});
				
				//надо ставить уже активный маркер
				//Новый текст
				placelisttext(group,desc,numi,1,1);
				UpdateCountGr(group);
				
				//Новая кнопка
				placebtn(oldx,oldy,numi,desc,0,group);
			}
		}
		if ((event.ctrlKey && event.shiftKey) && event.buttons>0 && mapposcx && mapposx && !circlept){
			//Отмена, возвращаем старые координаты
			maptarget.css('left',mapposcx+'px');
			maptarget.css('top',mapposcy+'px');
			mapposx=null;
			event.preventDefault();
		}
		
		if (mapcircle==1){mapcircle=0;maptarget=null;gTmpArr={};}
		
		//не отключаем перемещение если это точечный круг
		if (!circlept){
			mapposx=null;
		}
		
		return false;
	});
	$('#mainpic').mousemove(function(event){
		if ($(this).hasClass('active') || circlept){
			var mainpic;
			//если это круг
			if (mapcircle==1 ){
				//перемещаемый круг, круг-точка
				mainpic=maptarget;
			}
			else if (circlept==1){
				//круг пунктирный
				mainpic=maptarget;
				var inwnd=inWindow(maptarget,$('#mainpic .mycircle').not('.hide'));
				if (inwnd.length){
					//console.log(inwnd.length);
					var resultformatted='';
					inwnd.each(function(){
						resultformatted+='<div style="white-space:nowrap">'+$(this).attr('title').trim()+' ('+$(this).text().trim()+')</div>';
					})
					resultformatted+='<div style="white-space:nowrap">'+'Итого:'+inwnd.length+'шт. </div>';
					//отображаем подсказку
					$('.objcirclept .ptDescr').html(resultformatted);
				}
				else
				{
					//стираем подсказку
					$('.objcirclept .ptDescr').html('');
				}
			}
			else
			{
				mainpic=$('#mainpic');
			}
			if (mapposx!=null){
				var cx=0;
				var cy=0;
				cx=mapposcx+(event.pageX-mapposx);
				cy=mapposcy+(parseInt(event.pageY)-mapposy);
				
				if ((gmove || gsize) && mapcircle){
					var gcx, gcy;
					if (gsize){
						//Рост в у.е.
						gcx=(event.pageX-mapposx)/document.body.clientWidth;
						gcy=(parseInt(event.pageY)-mapposy)/document.body.clientHeight;
						//shift
						if (event.shiftKey){
							gcy=gcx;
						}
					}
					else
					{
						//Двигаем все координаты
						gcx=event.pageX-mapposx;
						gcy=parseInt(event.pageY)-mapposy;
					}
					
					$('#mainpic .mycircle').each(function(){
						var tmpel=$(this);
						
						if (gsize){
							cx=gTmpArr[tmpel.attr('id')].left*(gcx+1);
							cy=gTmpArr[tmpel.attr('id')].top*(gcy+1);
						}else
						{
							cx=gTmpArr[tmpel.attr('id')].left+gcx;
							cy=gTmpArr[tmpel.attr('id')].top+gcy;
						}
						
						tmpel.css('left',cx+'px');
						tmpel.css('top',cy+'px');
					});
				}
				else
				{
					mainpic.css('left',cx+'px');
					mainpic.css('top',cy+'px');
				}
			}
		}
		return false;
	});
	$('body').bind('mousewheel DOMMouseScroll', function(event){
		if (event.altKey && event.ctrlKey){
			//меняем zoom только с alt и ctrl
			var zoom=parseFloat($('#mainpic').css('transform').replace(/matrix\((.*?)\,.*\)/,'$1'));
			//console.log(event);
			if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
				// scroll up - увеличиваем
				zoom+=0.1;
			}
			else {
				// scroll down уменьшаем
				zoom-=0.1;
			}
			$('#mainpic').css({'transform':'scale('+zoom+')'});
		}
	});				
	// функция, которая по заданному селектору 
	// найдет соответствующие ему элементы, которые
	// при этом попадают в видимую область окна
	function inWindow(wnd,currentEls){
		var wndOffset = wnd.offset();
		
		var wndHeight = wnd.height();
		var wndWidth = wnd.width();
		var result = [];
		currentEls.each(function(){
			var el = $(this);
			var offset = el.offset();
			if((wndOffset.top <= offset.top && (el.height() + offset.top) < (wndOffset.top + wndHeight))
				&& (wndOffset.left <= offset.left && (el.width() + offset.left) < (wndOffset.left + wndWidth))
				){
				result.push(this);
			}
		});
		return $(result);
	}				
	$('#flylist').on('dblclick','.list-group-item-text',function(event){
		var el=$(this);
		var cce=$('#'+el.data('id'));
		centerOnMap(cce);
		
		/*
			//var par=el.parent();
			var cce=$('#'+el.data('id'));
			//+поправка на скролл, скролла нет
			var btnx=cce.get(0).offsetLeft-window.pageXOffset;
			var btny=cce.get(0).offsetTop-window.pageYOffset;
			
			var sx=screen.width;
			var sy=screen.height;
			var mainpic=$('#mainpic');
			
			var curscale=1;
			if (typeof(Profiles[profileIndex].zoom)!=undefined){
			//
			curscale=Profiles[profileIndex].zoom;
			}
			//увеличение по scale: (original*(scale-1))/2 - одна сторона, нормализация
			//уменьшение (original-(original*scale))/2
			
			//mainpic.css('left',sx/2-cce.get(0).offsetLeft+'px');
			//mainpic.css('top',sy/2-cce.get(0).offsetTop+'px');					
			$('#mainpic').css('left',sx/2+((mainpic.width()*(curscale-1))/2)-(btnx*curscale)+'px')
			$('#mainpic').css('top',sy/2+((mainpic.height()*(curscale-1))/2)-(btny*curscale)+'px')
		*/
		
	});
	$('#mainpic').dblclick(function(event){
		if (event.target.className.indexOf('mycircle')>=0){
			//дабл клик по кругу - ищем его id в списке и тыкаем по иконке.
			var newid=event.target.id;
			var flylist;
			flylist=$('#flylist .list-group-item .list-group-item-text');
			console.log(newid);
			flylist.each(function(){
				if ($(this).data('id')==newid){
					//нашли
					$(this).find('.icon').trigger('click');
				}
			});
		}
		else if(circlept==1){
			var tmpDesc=$('.objcirclept .ptDescr').text();
			console.log(tmpDesc.replace(/(\([\d]+\))/g,"$1\n"));
		}
		else
		{
			console.log('\'CoordX\'\:\''+event.offsetX+'px\'\,'+"\n"+'\'CoordY\'\:\''+event.offsetY+'px\'\,'+"\n");
			navigator.clipboard.writeText('\'CoordX\'\:\''+event.offsetX+'px\'\,'+"\n"+'\'CoordY\'\:\''+event.offsetY+'px\'\,'+"\n");
		}
		return false;
	});
	$('.maingroups').on('click','.list-group-item-heading .text',function(){
		var el=$(this);
		var par=el.parent().parent();
		if (el.hasClass('closed')){
			el.removeClass('closed');
			//open
			par.find('.list-group-item-text').removeClass('hide');
		}
		else{
			el.addClass('closed');
			//close
			par.find('.list-group-item-text').addClass('hide');
		}
	});
	$('#flylist').on('click','.list-group-item-text .icon',function(){
		var el=$(this);
		var par=el.parent();
		var groupnum=par.data('group');
		if (par.hasClass('active')){
			par.removeClass('active');
			$('#'+par.data('id')).addClass('hide');
			//off - add to history
			if (!par.parent().hasClass('autohist'))
			{
				var dataid=par.data('id')+profSym+profileIndex;
				var dataid2=par.data('id');
				
				//Чтобы не было дублей
				//globhist
				//profSym
				if (globhist!==null && !globhist.includes(dataid) && !globhist.includes(dataid2)){
					var newel=$($.parseHTML(jQuery.trim(par.get(0).outerHTML)));
					newel.data('id',dataid2);
					if (!$('#flylist .autohist .list-group-item-heading text').hasClass('closed')){
						//скрывалось в истории когда она закрыта
						newel.removeClass('hide');
					}
					newel.append($('<span class="icondel"></span>'));
					$('#flylist .autohist').append(newel);
					//запись в историю
					globhist.push(dataid);
					//update history
					setCookie(historyName,JSON.stringify(globhist),{expires:60*60*24*30,path:'/'})
				}
			}
			else
			{
				//newel.data('prof',profileCurrent);
				//profileIndex
				//it is history - unclick from other
				var flylist=$('#flylist .list-group-item-text').not(par);
				var parid=par.data('id');
				let histprof=par.data('prof');
				
				if (profileIndex==histprof){
					flylist.each(function(){
						if ($(this).data('id')==parid){
							$(this).removeClass('active');
						}
					});
				}
			}
		}
		else
		{
			par.addClass('active');
			$('#'+par.data('id')).removeClass('hide');
			if (par.parent().hasClass('autohist')){
				//it is history - ununclick from other
				var flylist=$('#flylist .list-group-item-text').not(par);
				var parid=par.data('id');
				let histprof=par.data('prof');
				
				if (profileIndex==histprof){
					flylist.each(function(){
						if ($(this).data('id')==parid){
							$(this).addClass('active');
						}
					});
				}
			}
		}
		UpdateCountGr(groupnum);
	});				
	$('.list-group-item-text').hover(
		function(){
			var el=$(this);
			$('#'+el.data('id')).addClass('highlight');
		},
		function(){
			var el=$(this);
			$('#'+el.data('id')).removeClass('highlight');
		}
	);
	$('.mycircle').hover(
		function(){
			var el=$(this);
			el.addClass('highlight');
		},
		function(){
			var el=$(this);
			el.removeClass('highlight');
		}
	);				
	$('.btall').on('click',function(){
		//active all
		var par=$('.list-group');
		var lhead=par.find('.list-group-item-heading').addClass('active');
		var ltext=par.find('.list-group-item-text').addClass('active');
		$('#mainpic .mycircle').removeClass('hide');
		UpdateCountGr();
	});
	$('.maingroups').on('click','.list-group-item-heading .icon',function(){
		var el=$(this);
		var par=el.parent();
		var hist=par.parent().hasClass('autohist');
		var histids=[];
		let histprof=null;
		
		var els=par.parent().find('.list-group-item-text');
		var act=els.filter('.active').length;
		var typeactive;
		
		if (hist){
			histprof=els.eq(0).data('prof');
		}
		
		
		if (els.length==act){
			typeactive=1;
			
			//выбраны все - обнуляем
			par.removeClass('active');
			els.removeClass('active');
			//обнуляем кружки, нужно обнулять только группу
			els.each(function(){
				tel=$(this);
				$('#'+tel.data('id')).addClass('hide');
				//запоминаем для истории
				if (hist){
					histids.push(tel.data('id'));
				}
			});
		}
		else{
			typeactive=0;
			
			par.addClass('active');
			if (act==0){
				//вообще не выбраны - заполняем все
				els.addClass('active');
			}
			else
			{
				//выбраны не все - заполняем все
				els.addClass('active');
			}
			//заполняем кружки, нужно отображать только группу
			els.each(function(){
				tel=$(this);
				$('#'+tel.data('id')).removeClass('hide');
				//запоминаем для истории
				if (hist){
					histids.push(tel.data('id'));
				}						
			});
		}
		
		//if it history - activate/remove other list items and our
		if (profileIndex==histprof && hist){
			//console.log(histids);
			var flylist=$('#flylist .list-group-item-text');
			
			if (typeactive){
				flylist=flylist.filter('.active');
				//деактивируем
				flylist.each(function(){
					if(jQuery.inArray($(this).data('id'), histids) !== -1){
						$(this).removeClass('active');
					}
				});
			}
			else
			{
				flylist=flylist.not('.active');
				//активируем
				flylist.each(function(){
					if(jQuery.inArray($(this).data('id'), histids) !== -1){
						$(this).addClass('active');
					}
				});
			}
		}
		
		UpdateCountGr(els.eq(0).data('group'));
	});
	
	$('#flylist').on('click','.list-group-item-text .icondel',function(){
		//delete from history
		var par=$(this).parent();
		var dataid=par.data('id')+profSym+profileIndex;
		var dataid2=dataid;
		par.remove();
		//Проверка
		if (globhist.includes(dataid) || globhist.includes(dataid2)){
			//удаление из истории
			var tmpindex = globhist.indexOf(dataid);
			if (tmpindex > -1) {
				globhist.splice(tmpindex, 1);
			}
			//update history
			setCookie(historyName,JSON.stringify(globhist),{expires:60*60*24*30,path:'/'})
		}
	});
	$('.helpp > div > h2').on('click',function(){
		$(this).next().toggleClass('hide');
	});
	//searchbtn
	$('.searchbtn').on('click',function(){
		//Поиск
		$('.searchdlg').toggleClass('hide');		
	});
	$('.searchdlg input').on('keyup',function(event){
		var countpta,profi,curpta;
		
		q=$(this).val();
		if (event.keyCode == 13 || q.length>2) {
			//Поиск
			var sresult=[];
			var otresult=[]; //поиск по неактивным профилям
			if (q.length){
				$('#mainpic .mycircle').each(function(){
					if ($(this).attr('title').indexOf(q)!==-1){
						sresult.push($(this).attr('id'));
					}
				});
				//сделаем поиск по неактивным профилям
				
				var objotr;
				for (profi=0;profi<Profiles.length;profi++){
					if (profileIndex==profi){continue;}
					curpta=self[Profiles[profi].pointarr];
					for (i=0;i<curpta.length;i++){
						//Profiles[profi].pointsarr[i]
						if (curpta[i].Name.indexOf(q)!==-1){
							objotr={};
							objotr.itext=curpta[i].Name+', '+Profiles[profi].Name+' ('+(i+Profiles[profi].StartIndex)+')'
							objotr.profile=profi;
							objotr.id=preId+(i+Profiles[profi].StartIndex);
							otresult.push(objotr);
						}
					}
				}
			}
			//console.log(sresult);
			//console.log(otresult);
			if (sresult.length || otresult.length){
				var sdlgwnd=$(".searchdlg .custom");
				sdlgwnd.find('.list-group-item-text').remove();
				var tmplist=$('#tmplist').html();
				var newid,cce,newel;
				//sresult.concat(otresult);
				for (var i=0;i<sresult.length;i++){
					cce=$('#'+sresult[i]);
					newid=cce.get(0).id;
					
					
					//у нас есть id - берем с маркеров на карте описания
					newel = $($.parseHTML( jQuery.trim(tmplist.replace(/#text#/gi, $('#'+newid).attr('title')+" ("+newid+")"))));
					newel.find('.icon').remove();
					
					newel.data('id',newid);
					newel.on('click',function(event){
						centerOnMap($('#'+$(this).data('id')));
					});
					
					sdlgwnd.append(newel)
				}
				for (var i=0;i<otresult.length;i++){
					newel = $($.parseHTML( jQuery.trim(tmplist.replace(/#text#/gi, otresult[i].itext))));
					newel.find('.icon').remove();
					
					newel.data('id',otresult[i].id);
					newel.data('profile',otresult[i].profile);
					newel.on('click',function(event){
						var profileIndex=$(this).data('profile');
						var sibs =$('#flyProf .list-group-item');
						sibs.eq(profileIndex+1).click();
						
						$('.btall').click();
						centerOnMap($('#'+$(this).data('id')));
					});
					
					sdlgwnd.append(newel)
				}
			}
		}
	})
	function centerOnMap(el){
		//+поправка на скролл, скролла нет
		var btnx=el.get(0).offsetLeft-window.pageXOffset;
		var btny=el.get(0).offsetTop-window.pageYOffset;
		
		var sx=$('body').width();//screen.width;
		var sy=$('body').height();//screen.height;
		var mainpic=$('#mainpic');
		
		var curscale=1;
		if (typeof(Profiles[profileIndex].zoom)!=undefined){
			//
			curscale=Profiles[profileIndex].zoom;
		}
		
		//расстояние до кнопки когда она уже уменьшилась
		var bonusbtn=(20*(curscale-1))/2;
		
		
		//$('#mainpic').css('left',sx/2+((mainpic.width()*(curscale-1))/2)-(btnx*curscale)-bonusbtn+'px')
		//$('#mainpic').css('top',sy/2+((mainpic.height()*(curscale-1))/2)-(btny*curscale)-bonusbtn+'px');
		
		//((изначальная ширина*scale)-изначальная ширина)/2 - то что вышло за пределы с одного бока
		//calc(928.5px + 278.25px - (217px * 3.1)-21px )
		
		var mapnullw=(mainpic.width()*(curscale-1))/2;
		var mapnullh=(mainpic.height()*(curscale-1))/2;
		
		//и минус пол. кнопки - (20/2
		
		$('#mainpic').css('left',sx/2+mapnullw-(btnx*curscale)-bonusbtn-(20/2)+'px');
		$('#mainpic').css('top',sy/2+mapnullh-(btny*curscale)-bonusbtn-(20/2)+'px');
		
	}
	
	//Очистка истории
	$('.maingroups').on('click','.list-group-item.autohist h4',function(event){
		if (event.altKey){
			globhist=[];
			//update history
			setCookie(historyName,JSON.stringify(globhist),{expires:60*60*24*30,path:'/'})
			//также надо удалить метки
			$('.maingroups .list-group-item.autohist .list-group-item-text').remove();
		}
	});
	
	//работа с куками
	function getCookie(name) {
		var matches = document.cookie.match(new RegExp(
			"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
		));
		if (!matches){
			matches=[];
			matches[1]=localStorage.getItem(historyName);
		}
		ret=matches ? decodeURIComponent(matches[1]) : undefined;
		
		return ret;
	}	
	function setCookie(name, value, options) {
		options = options || {};
		
		var expires = options.expires;
		
		if (typeof expires == "number" && expires) {
			var d = new Date();
			d.setTime(d.getTime() + expires * 1000);
			expires = options.expires = d;
		}
		if (expires && expires.toUTCString) {
			options.expires = expires.toUTCString();
		}
		
		value = encodeURIComponent(value);
		
		var updatedCookie = name + "=" + value;
		
		for (var propName in options) {
			updatedCookie += "; " + propName;
			var propValue = options[propName];
			if (propValue !== true) {
				updatedCookie += "=" + propValue;
			}
		}
		
		document.cookie = updatedCookie;
		localStorage.setItem(name, value);
	}
	function deleteCookie(name) {
		setCookie(name, "", {
			expires: -1
		})
	}	
	//работа с куками
});							