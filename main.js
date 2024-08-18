//import { myValue } from "./lang/ru/index.js";
//import { myValue } from "/modules/my-module.js";
var keymove=0;
var gmove=0; //global move - перемещение
var gsize=0; //gloval size - изменения расстояния всех значков
var invIndex=0;
var drawLines=0; //режим рисования линий
//var drawLines=0;  //признак что включен режим рисования линий
/*
	на будущее
	&#9203;
	&#9749;
	&#9851;
	&#9855;
	&#9971;
	&#9999;
	https://pixelplus.ru/samostoyatelno/stati/vnutrennie-faktory/tablica-simvolov-unicode.html
*/
$(document).ready(function() {
	var mapcircle=0; //признак что курсор находится на точке-круге, метке на карте.
	var maptarget=null;
	var movehist=0; //режим перемещения элементов истории
	var moveGroup=0; //режим перемещения групп
	var mapposx=null,mapposy=null; //старые координаты точки mouse event как на экране
	var mapposcx=null,mapposcy=null; //старые координаты точки относительно в элементе
	var circlept=0;  //признак что включен информационный прямоугольник
	var Selectpt=0;  //признак что включен прямоугольник выделения
	var defaultProfile=0; //профиль по дефолту.
	var profileIndex=defaultProfile; //текущий профиль (список справа).
	var gTmpArr={}; //старые координаты, при чем множественные, для выделенных точек или для всех точек.
	var selectedArr=[]; //массив выделенных элементов
	var historyName; //имя массива истории
	let profSym='@g='; //символ разделитель между профилем и точкой, для истории
	var preId='mapoint'; //ид перед названием точки
	var activeongroups=1; //включать ли категории (в начале и при переключении профилей-карт)
	var lastId; //последний ид точки-круга (для применения действий над ним)
	var histMoveNum; //номер перемещаемого элемента
	var defaultLang='RU' //язык по дефолту.
	var langScript; //скрипт языка
	var settingsName; //название настроек
	var globhist; //массив истории
	var globSettings; //массив настроек
	var mapSettings; //скрипт настроек
	var RouteLines=[]; //стрелки маршрутов, объекты
	var defRouteCount=3; //Стандартная длина маршрута
	var IgnoreName; //Имя игнор листа для маршрутов
	var globIgnore=[]; //Список точек для игнора при перерисовке маршрута
	var directrix=[]; //направляющие линии
	var tmpDirectrix=null; //направляющая линия временная (для показа во время рисования)
	var tmpPointsDx={}; //точки для направляющей
	var dLSelectDefault=0;//какой инструмент выбирать по умолчанию (0 - tmpLine) в режиме рисования
	var dLSelected=0;//какой инструмент выбирать по умолчанию (0 - tmpLine) в режиме рисования
	var leaderLineOptions={};//опции для постоянной линии
	var arrPLines=[];//Массив постоянных линий
	
	
	//загрузка истории
	//historyName=$('.historyName').text();
	historyName=$('.gameName').text()+'hist';
	settingsName=$('.gameName').text()+'settings';
	IgnoreName=$('.gameName').text()+'ignore';
	//Загрузка настроек
	loadSettings();
	//Установка настроек
	setupSettings();
	//загрузка карт
	loadMAPSettings(defaultLang).then((result1) => {
		//console.log(result1);
		init();
	})
	function init(){
		//Загрузка истории
		loadHistory();
		//загрузка игнор листа
		loadGlobIgnore();
		//Выводим группы
		$('#flyProf .list-group-item').not('.custom').remove();
		$('#flyProf .mainfly').append(wrapGroups());
		//Включаем язык
		$('.langSelect .list-group-item').each(function(){
			if (this.innerText.trim()==defaultLang){
				this.classList.add('active')
			}
		})
		//меняем язык
		langSelect(defaultLang).then((data)=>{
			//console.log(data);
			//подгружаем профиль
			profileSelect(defaultProfile);
		});
	}
	function setupSettings(){
		if (globSettings['lang']){
			defaultLang=globSettings['lang'];
		}
	}
	function loadSettings(){
		globSettings=localStorage.getItem(settingsName);
		try {
			globSettings = JSON.parse(decodeURIComponent(globSettings));
		}
		catch(e) {
			console.log('Настройки неверный формат / settings corrupted');
			globSettings={};
		}
		if (globSettings===null){
			console.log('Настроек нет / settings not found');
			globSettings={};
		}
	}
	function loadHistory(){
		globhist=getCookie(historyName);
		try {
			//globhist=[];
			globhist = JSON.parse(globhist);
			//Если история есть заполняем группу история всеми элементами.
			//console.log(globhist);
			//loadhist(); !!! история загружается в другом месте profile select, тут загружать не надо
		}
		catch(e) {
			//console.log(e); // error in the above string (in this case, yes)!
			console.log('Данных истории в куках нет / history corrupted');
			globhist=[];
		}
		if (globhist===null){
			console.log('История не существует / history not found');
			globhist=[];
		}
	}
	function loadGlobIgnore(){
		globIgnore=getCookie(IgnoreName);
		if (globIgnore===null){
			//console.log('Игнор листа нет / ignore list not found');
			globIgnore=[];
		}
		try {
			globIgnore = JSON.parse(globIgnore);
		}
		catch(e) {
			//console.log('данных по игнор листу нет / ignore list corrupted');
			globIgnore=[];
		}
	}
	async function loadMAPSettings(langdir){
		let path='./lang/'+langdir+'/settings.js';
		if (typeof(mapSettings)!='undefined'){
			//уже есть, удаляем
			mapSettings.remove();
		}
		//load sctipt
		mapSettings = document.createElement('script');
		mapSettings.src = path;
		//wait
		return new Promise((resolve, reject) => {
			mapSettings.onload = function() {
				resolve("maps/profiles loaded");
				if (typeof(Profiles)=='undefined'){
					//хотя-бы пустой массив
					Profiles=[];
				}
			}		
			document.body.append(mapSettings);
		});
	}
	function langSelect(langdir){
		//import
		let path='./lang/'+langdir+'/index.js';
		if (typeof(langStr)!='undefined'){
			//уже есть, удаляем
			langScript.remove();
		}
		//load sctipt
		langScript = document.createElement('script');
		langScript.src = path;
		document.body.append(langScript);
		//wait - будем ждать
		return new Promise((resolve, reject) => {
			langScript.onload = function() {
				resolve("Язык загружен");
				replaceLangStr(langStr);
			}		
			document.body.append(mapSettings);
		});
		
	}
	function replaceLangStr(langStr){
		var lanobj=$(document.body).find('.langCh');
		var langKey;
		var oldlangstr;
		lanobj.each(function(){
			var el=$(this);
			var langOld=0;
			var lanOldelem;
			lanOldelem=$(this).find('.langOld');
			if (lanOldelem.length>0){
				//если уже была обработка 
				langOld=1;
			}
			if (langOld){
				langKey=lanOldelem.html();
			}
			else
			{
				langKey=this.innerText.trim();
			}
			if (langKey in langStr){
				fulllangstr='<span class="langNow">'+langStr[langKey]+'</span>'+'<span class="langOld">'+langKey+'</span>';
				if (langOld){
					//если уже была обработка 
					//el.find('.langNow').get(0).outerHTML='';
					el.find('.langNow').remove();
					langKey=lanOldelem.get(0).outerHTML;
					this.innerHTML=this.innerHTML.replace(langKey,fulllangstr);
				}
				else
				{
					this.innerHTML=this.innerHTML.replace(langKey,fulllangstr);
				}
			}
			else{
				console.log(langKey);
			}
		});
	}
	function wrapMainGroups(ghtml){
		//для групп текущего профиля maingroups
		var newel=$('#tmpGroup').html();
		let newhtml=$($.parseHTML( jQuery.trim(newel.replace(/#text#/gi, ghtml))));
		return newhtml;
	}
	function wrapGroups(active=0){
		//для карт/профилей
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
	$('#flyProf').on('click','.list-group-item:not(.custom)',function(e){
		var el=$(this);
		var elPar=el.parent();
		var sibs=elPar.find('.list-group-item');
		if (e.shiftKey){
			//1. найдем карту
			var idMap=+$(el).data('id');
			var mapOldText=Profiles[idMap].Name;
			//Переименовываем карту
			var newName = prompt("Название:", mapOldText);
			if (mapOldText!=newName && newName != null){
				//2. меняем внутри
				Profiles[idMap].Name=newName;
				//3. меняем визуально
				let newHtml=el.find('.text').html().replace(mapOldText,newName);
				el.find('.text').html(newHtml);
				//console.log('map rename '+el.get(0));
			}
			event.preventDefault();
		}
		else{
			sibs.removeClass('active');
			el.addClass('active');
			profileIndex=sibs.index(el);
			profileSelect(profileIndex);
		}
	})
	function profileSelect(num){
		var mainpic=$('#mainpic');
		var zoom=1;
		if (Profiles[num]==undefined){return;}
		if (typeof(Profiles[num].zoom)!=undefined){
			zoom=Profiles[num].zoom;
		}
		mainpic.find('img').attr('src',Profiles[num].File).end().css({'transform':'scale('+zoom+')'});
		//загрузка массива точек
		pointsarr=self[Profiles[num].pointarr];
		//Смена индекса точек
		if (Profiles[num].StartIndex>0){
			ChangePointIdex(Profiles[num].StartIndex);
		}
		mainpic.css('left',Profiles[num].offsetLeft);
		mainpic.css('top',Profiles[num].offsetTop);
		$('.maingroups .list-group-item').remove();
		//Добавление групп, массив групп
		var groupscnt=Profiles[num].GpoupList.length;
		var groupsHtml=$('');
		for (z=0;z<groupscnt;z++){
			//сразу имя
			groupsHtml=groupsHtml.add(wrapMainGroups(Profiles[num].GpoupList[z]));
		}
		//и история
		groupsHtml=groupsHtml.add(wrapMainGroups($('#tmpHistname .langNow').html()).addClass('autohist'));
		$('.maingroups').append(groupsHtml);
		//Добавим иконку удаления групп
		//Активация всех групп, кроме истории
		if (activeongroups){
			//active all
			$('.maingroups .list-group-item:not(.autohist) .list-group-item-heading').addClass('active');
		}
		//замена точек 
		mainpic.find('.mycircle').remove();
		//заполнение списков и точек
		fillGroupsList();
		//Добавляем custom стили для групп точек
		var groupsall=$('.maingroups .list-group-item:not(.autohist)');
		var groupscnt=groupsall.length;
		for (z=0;z<groupscnt;z++){
			var tmpgroup=groupsall.eq(z);
			if (tmpgroup.get(0).hasAttribute('custombg')){
				//добавил правило
				addLastCss('.cg'+z,'background: '+tmpgroup.attr('custombg'));
				//очищалка
				mainpic.find('.cg'+z).addClass('ClearCg');
			}
			if (tmpgroup.get(0).hasAttribute('customstyle')){
				addLastCss('.cg'+z,tmpgroup.attr('customstyle'));
				//очищалка
				mainpic.find('.cg'+z).addClass('ClearCg');
			}
		}
		//Добавляем custom стили для групп точек
		//Пересчет кол-ва точек в группе
		UpdateCountGr();
		//Уменьшаем значки
		$('.mycircle').css({'transform':'scale('+1/zoom+')'});
		//Подгрузка истории
		if (globhist){loadhist();}
		//Закрыть все группы
		closeGroups();
		//загрузка и отрисовка постоянных линий
		if (Profiles[num]['pLines'] !== undefined){
			try {
				tmpResult = JSON.parse(Profiles[num]['pLines']);
				drawPermanentLines(tmpResult);
			}
			catch(e) {
				console.log('Постоянные линии неверный формат / permanenet lines corrupted'+e);
			}
		}
	};
	function drawPermanentLines(linesArr){
		//leaderLineOptions
		var tmpleaderLineOptions=leaderLineOptions;
		if (Array.isArray(linesArr)){
			linesArr.forEach(function(oneLine){
				if (typeof oneLine === 'object'){
					//draw oneLine
					//lineOptionsArr['start']=undefined;
					//lineOptionsArr['end']=undefined;
					leaderLineOptions=oneLine;
					let obj=drawLineEx(oneLine.x1,oneLine.y1,oneLine.x2,oneLine.y2);
					obj.position();
				}
			});
		}
		leaderLineOptions=tmpleaderLineOptions;
	};
	function addLastCss(selector,propStr){
		var Helpname='helperStyle';
		var sheets = document.styleSheets;
        var styleEl='';
		var styleSheet;
		for( var i in document.styleSheets ){
			if( sheets[i].title && sheets[i].title.indexOf(Helpname) > -1 ) {
				styleEl = sheets[i];
				break;
			}
		}		
		//mdn
		if (!styleEl){
			styleEl = document.createElement('style');
			styleEl.title=Helpname;
			// Append <style> element to <head>
			document.head.appendChild(styleEl);
		}
		// Grab style element's sheet
		styleSheet = styleEl.sheet;
		if (typeof(styleEl.insertRule)==='function') {
			styleSheet = styleEl;
		}
		if (typeof(styleSheet)=='undefined'){
			console.log('styles err');
		}
		else
		{
			if (typeof(styleSheet.insertRule)==='function') {
				styleSheet.insertRule(selector + '{' + propStr + '}', styleSheet.cssRules.length);
			}
			else {
				//IE
				styleSheet.addRule(selector, propStr, -1);
			}
		}
	}
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
					//добавляет точку в список групп
					placelisttext(group[z],pointsarr[i].Name,numi,activeongroups)
				}
			}
			placebtn(pointsarr[i].CoordX,pointsarr[i].CoordY,numi,pointsarr[i].Name,1-activeongroups,group[0]);
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
	function TestPtProfile(findindex){
		if (typeof(TestPtProfile.ptArr)=='undefined'){
			TestPtProfile.ptArr=[];
		}
		if (!TestPtProfile.ptArr.length){
			for (var el in self['Profiles']){
				TestPtProfile.ptArr.push(self['Profiles'][el].pointarr);
			}
		}
		return result=TestPtProfile.ptArr.indexOf(findindex);
	}
	function loadhist(){
		var tmplist=$('#tmplist');
		var tmparr;
		var tmpcnt=globhist.length;
		var groupnum;
		var flylist=$('#flylist .list-group-item .list-group-item-text');
		for (var i=0;i<tmpcnt;i++){
			var newid=globhist[i];
			if (newid.indexOf(profSym)){
				//история содержит группы, в старых версиях не содержит
				tmparr=newid.split(profSym);
				newid=tmparr[0];
				if (isNaN(tmparr[1])){
					//Новая версия где вместо номера профиля значение его pointarr
					profileCurrent=TestPtProfile(tmparr[1]);
					if (!profileCurrent && profileCurrent!==0){
						//не нашли
						profileCurrent=null;
					}
				}
				else
				{
					//старая версия, оставлено для совместимости
					profileCurrent=tmparr[1];
				}
			}
			else{
				profileCurrent=null;
			}
			//Если профиль не найден или не указан, пропускаем			
			//Если профиль записи не равен профилю текущей карты, пропускаем
			if (profileCurrent==null || profileCurrent!=profileIndex){continue;}
			//globhist.push(dataid+profSym+groupnum);
			var newel=tmplist.html();
			//у нас есть id - берем с маркеров на карте описания
			newel = $($.parseHTML( jQuery.trim(newel.replace(/#text#/gi, $('#'+newid).attr('title')+' ('+newid.replace(preId,'')+')'))));
			//отключаем кнопки - по умолчанию
			$('#'+newid).addClass('hide');
			newel.data('id',newid);
			if (typeof(profileCurrent)!='undefined'){
				newel.data('prof',self['Profiles'][profileCurrent].pointarr);
			}
			if (groupnum){newel.data('group',groupnum);}
			newel.append($('<span class="icondel"></span>'));
			//$('#flylist .autohist').append(newel);
			$('#flylist .autohist').find('.list-group-item-heading').after(newel);
			//unclick btn
			//дабл клик по кругу - ищем его id в списке и тыкаем по иконке.
			flylist.each(function(){
				if ($(this).data('id')==newid){
					//нашли
					//$(this).find('.icon').trigger('click');
					$(this).removeClass('active');
					//break
					return false;
				}
			});
			UpdateCountGr(groupnum);
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
		if (setActive){newel.addClass('active');}
		if (setHide){newel.addClass('hide');}
		var groupsfly=flylist.find('.list-group-item').eq(groupnum);
		groupsfly.append(newel);
	}
	function placebtn(x,y,num,tname,thide=1,onegroup,bonusClass=''){
		var flylist=$('#flylist');
		var tmpbtn=$('#tmpbtn');
		var mainpic=$('#mainpic');
		var newel=tmpbtn.html();
		newel = $.parseHTML( jQuery.trim(newel.replace(/#number#/gi, num)));
		newel=$(newel);
		newel.css({'left':x,'top':y});
		newel.attr('id',  preId+num );
		newel.attr('title',  tname );
		newel.addClass('cg'+onegroup);
		newel.data('group',onegroup);
		if (bonusClass.length){
			newel.addClass(bonusClass);
		}
		if (thide){
			newel.addClass('hide');
		}
		mainpic.append(newel);
	}
	$('#flyProf .container > h2').on('click',function(event){
		$('.mainfly').toggleClass('hide');
	});
	function addslashes( str ) {
		return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
	}
	function drawpoint(tmppoint,ptarr,nindex){
		//для вывода в файл settings, формирует массив точек
		ptprops='';
		for (prop in self[Profiles[nindex].pointarr][tmppoint]) {
			if (prop=='PointIndex'){continue;}
			if (prop=='Name'){
				self[Profiles[nindex].pointarr][tmppoint][prop]=addslashes(self[Profiles[nindex].pointarr][tmppoint][prop]);
			}
			ptprops+='\t\t';
			ptprops+='\''+prop+'\' : \''+self[Profiles[nindex].pointarr][tmppoint][prop]+'\','+"\n";
		}
		return '\t{'+"\n"+ptprops+'\t},'+"\n";
	}
	$('#flylist > .container > h2').on('click',function(event){
		if (event.ctrlKey){
			$(this).siblings('.maingroups').toggleClass('hide');
		}
	});
	$('#flylist > .container > h2').dblclick(function(event){
		var curtext='',alton=0;
		//profileIndex
		//добавляем постоянные линии в профиль
		if (arrPLines.length){
		Profiles[profileIndex]['pLines']=JSON.stringify(arrPLines);
		}
		
		newGlobhist=[]; //временный массив истории для сортировки
		if (event.altKey){
			//сортируем массив ключей профиля в историческом порядке
			alton=1;
		}
		//массив соответствий группы и ид
		var arrgroup={};
		var flylist;
		var cntgroups=$('#flylist .maingroups .list-group-item').not('.autohist').length;
		var groupi=0;
		for (groupi=0;groupi<cntgroups;groupi++){
			flylist=$('#flylist .maingroups .list-group-item:eq('+groupi+') .list-group-item-text');
			flylist.each(function(){let thisid=$(this).data('id'); if (thisid!=undefined){arrgroup[thisid] = groupi;} });
		}
		var tmpval='';
		var tmpproftext='';
		//старые профили
		//Полный вывод
		var tmpprof={};
		var profhead='';
		if (alton){
			//сортируем массив ключей профиля в историческом порядке
			var arrsort=[];
			for (nindex in Profiles) {
				//Profiles[nindex].pointarr
				tmpsort=Object.keys(self[Profiles[nindex].pointarr]);
				//дополняем
				for (tmppoint in tmpsort) {
					tmpsort[tmppoint]=preId+(Number(tmpsort[tmppoint])+Profiles[nindex].StartIndex)+profSym+Profiles[nindex].pointarr;
				}
				//сортируем индексы
				//инвертируем в случае отсутствия значения в истории - те, которых нет в истории сдвинутся вперед
				tmpsort.sort((a, b) => ((globhist.indexOf(a)<0 || globhist.indexOf(b)<0)?-(globhist.indexOf(a) - globhist.indexOf(b)):(globhist.indexOf(a) - globhist.indexOf(b))));
				//Переделываем историю
				for (tmppoint in tmpsort) {
					tmppos=globhist.indexOf(tmpsort[tmppoint]);
					if (tmppos>=0){
						newGlobhist[tmppos]=preId+(Number(tmppoint)+Profiles[nindex].StartIndex)+profSym+Profiles[nindex].pointarr;
					}					
				}
				//удаляем дополнения
				for (tmppoint in tmpsort) {
					tmpsort[tmppoint]=(Number(tmpsort[tmppoint].split(profSym)[0].replace(preId,''))-Profiles[nindex].StartIndex);
				}
				//tmparr=newid.split(profSym);
				arrsort[nindex]=tmpsort;
			}
			//на выходе получаем массив нужного профиля с индексами в нужном порядке
			//update history
			setCookie(historyName,JSON.stringify(newGlobhist),{expires:60*60*24*30,path:'/'})
		}
		//Собираем профили и старые и текущий
		for (nindex in Profiles) {
			tmpproftext='';
			for (prop in Profiles[nindex]) {
				tmpval=Profiles[nindex][prop];
				origTmpVal=Profiles[nindex][prop];
				if (typeof(tmpval)=='undefined'){
					//хотя-бы пустой массив
					tmpval='';
				}
				tmpval=tmpval.toString().replace(/\t\t/g,String.fromCharCode(92)+"\n\t\t");
				if (Array.isArray(origTmpVal)){
					//GpoupList
					tmpproftext+='\t\t';
					tmpproftext+="'"+prop+"':"+JSON.stringify(origTmpVal).replaceAll('"','\'')+","+"\n";
					}else if (isNaN(tmpval)){
					tmpproftext+='\t\t';
					tmpproftext+="'"+prop+"':'"+tmpval+"',"+"\n";
				}
				else
				{
					tmpproftext+='\t\t';
					tmpproftext+="'"+prop+"':"+tmpval+","+"\n";
				}
			}
			//текущая карта отправляется наверх
			if  (nindex==profileIndex){
				profhead="\n\t"+'{'+"\n"+tmpproftext+'\t},'+profhead;
			}
			else
			{
				profhead+="\n\t"+'{'+"\n"+tmpproftext+'\t},';
			}
			//getall old points, старые точки
			ptarr='';
			if (alton){
				for (tmppoint in arrsort[nindex]) {
					ptarr+=drawpoint(arrsort[nindex][tmppoint],ptarr,nindex);
				}
			}
			else{
				for (tmppoint in self[Profiles[nindex].pointarr]) {
					ptarr+=drawpoint(tmppoint,ptarr,nindex);
				}
			}
			tmpprof[nindex]='var '+Profiles[nindex].pointarr+'=['+"\n"+ptarr+'];'+"\n";
		}
		curtext+='var Profiles=['+profhead+"\n"+']'+"\n\n";
		//Текущий профиль, точки
		var curbtn='';
		flylist=$('#mainpic .mycircle');
		function drawpointCur(el,group){
			var elemmap=$(el);
			var curbtn='';
			if (typeof(group)=='undefined' || group=='undefined'){
				group=el.data('group');
			}
			curbtn+="\t"+'{'+"\n";
			curbtn+="\t\t"+"'Name':'"+addslashes(elemmap.attr('title'))+"',"+"\n";
			curbtn+="\t\t"+"'CoordX':'"+elemmap.css('left')+"',"+"\n";
			curbtn+="\t\t"+"'CoordY':'"+elemmap.css('top')+"',"+"\n";
			curbtn+="\t\t"+"'Groups':'"+"["+group+"]',"+"\n";
			curbtn+="\t"+'},'+"\n";
			return curbtn;
		}
		//собираем точки
		if (alton){
			for (tmppoint in arrsort[profileIndex]) {
				el=flylist.filter('#'+preId+(Profiles[profileIndex].StartIndex+arrsort[profileIndex][tmppoint]));
				curbtn+=drawpointCur(el,arrgroup[el.attr('id')]);
			}
		}else
		{
			flylist.each(function(){
				el=$(this);
				curbtn+=drawpointCur(el,arrgroup[el.attr('id')]);
			});
		}
		//no data
		if (Profiles[profileIndex]!=undefined){
			curbtn='var '+Profiles[profileIndex].pointarr+'=['+"\n"+curbtn+'];'+"\n";
		}
		tmpprof[profileIndex]=curbtn;
		for (profindex in tmpprof) {
			if (profindex!=profileIndex){
				curtext+=tmpprof[profindex];
			}
		}
		//Точки текущей карты помещаются в конец
		curtext+=tmpprof[profileIndex];
		//console.log(curtext);
		navigator.clipboard.writeText(curtext).then(response => {
			console.log('ok');
		}
		).catch(e => {
			console.log(e);
		});
		return false;
	});
	$(document).on('keydown',function(event){
		//if you're using jQuery, you can reliably use which as jQuery
		//var x = event.which || event.keyCode;
		if (typeof(keymove)!='undefined' && keymove && typeof(lastId)!='undefined'){
			var obj=$('#'+lastId);
			var objleft=parseInt(obj.css('left'));
			var objtop=parseInt(obj.css('top'));
			//console.log(event.which);
			switch(event.which){
				case 37:
				//left
				obj.css('left',(objleft-1)+'px');
				break;
				case 38:
				//up
				obj.css('top',(objtop-1)+'px');
				break;
				case 39:
				//right
				obj.css('left',(objleft+1)+'px');
				break;
				case 40:
				//down
				obj.css('top',(objtop+1)+'px');
				break;
			}
		}
		
	})
	$('body').keypress(function(event){
		if (event.shiftKey && event.keyCode==68){
			//отменяем выделение
			if (selectedArr.length){
				$(selectedArr).removeClass('ptSelect');
				selectedArr=[];
			}
			event.preventDefault();
		}
		if (typeof(routeShow)!='undefined' && routeShow){
			var changes=0;
			if (event.keyCode==91 || event.keyCode==1093){
				//minus [
				if (defRouteCount>2){
					defRouteCount-=1;
					changes=1;
				}
			}
			else if (event.keyCode==93 || event.keyCode==1098){
				//plus ]
				var maxCnt=$('#mainpic .mycircle').length;
				if (defRouteCount<maxCnt){
					defRouteCount+=1;
					changes=1;
				}
			}
			if (changes){
				console.log('prevent');
				event.preventDefault();
				DeleteRoute();
				CreateRoute();
			}
		}
		else if (circlept){
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
				if (maptarget){
					maptarget.width(parseInt(maptarget.width())+10);
					maptarget.height(parseInt(maptarget.height())+10);
				}
			}
		}
		else if ($(event.target).hasClass('searchInput')){
			//console.log('search');
		}
		else{
			if (event.keyCode==107){
				//keymove (k)
				keymove=1-keymove;
				$('#flycMenu .list-group-item-text[data-action="keymove"]').toggleClass('active');
			}
			console.log(event.keyCode);
		}
	})
	$('#flyProf').on('click','.menuaction',function(event){
		$('#flycMenu').toggleClass('hide').css({'left':$('body').width()-$('#flycMenu').width()-parseInt($('.container').css('padding-right'))-$('.mainfly').width(),'top':$(this).offset().top});
		$('#flycMenu').on('click',function(){$(this).addClass('hide')});
	});
	$('#flyProf').on('click','.oneaction',function(event){
		$('#flyaoMenu').toggleClass('hide').css({'left':$('body').width()-$('#flyaoMenu').width()-parseInt($('.container').css('padding-right'))-$('.mainfly').width(),'top':$(this).offset().top});
		$('#flyaoMenu').on('click',function(){$(this).addClass('hide')});
	});
	$('#flyaoMenu .list-group-item .savemap').on('click',(event)=>{
		var el=$(event.target);
		if (!el.hasClass('active')){
			el.addClass('active');
			SaveMapZC();
			el.removeClass('active');
		}
	});
	function SaveMapZC(){
		var mapel=$('#mainpic');
		Profiles[profileIndex]['offsetTop']=mapel.css('top');
		Profiles[profileIndex]['offsetLeft']=mapel.css('left');
		Profiles[profileIndex]['zoom']=parseFloat(mapel.css('transform').replace(/matrix\((.*?)\,.*/,'$1'));
	}
	$('#flyaoMenu .list-group-item .newprof').on('click',(event)=>{
		//Новый профиль/карта
		var el=$(event.target);
		var pName = prompt("Название:", event.target.title);
		var pFile = prompt("Файл:", event.target.title);
		var newIndex=Profiles.length;
		var defGroup=['test group'];
		//история
		
		if (pName!==false && pFile!==false &&
			!pName.match(/^[^А-я\w\d\s_-]*$/) &&
			!pFile.match(/^[^\w\d\s_-]*$/)
			){
			var pPt=pFile.replace(/(.*?)\..*/,'$1').replace(/^.*\/(.*?)$/,'$1')+'Pt';
			Profiles[newIndex]={};
			Profiles[newIndex]['Name']=pName;
			Profiles[newIndex]['File']=pFile;
			Profiles[newIndex]['pointarr']=pPt;
			Profiles[newIndex]['zoom']=Profiles[profileIndex]['zoom'] || 1;
			Profiles[newIndex]['StartIndex']=Profiles[profileIndex]['StartIndex'] || 1;
			Profiles[newIndex]['offsetLeft']=Profiles[profileIndex]['offsetLeft'] || '0px';
			Profiles[newIndex]['offsetTop']=Profiles[profileIndex]['offsetTop'] || '0px';
			Profiles[newIndex]['GpoupList']=Profiles[profileIndex]['GpoupList'] || defGroup;
			//set new point left top
			var OneBtn='';
			OneBtn+="\t"+'{'+"\n";
			OneBtn+="\t\t"+"'Name': 'New',"+"\n";
			OneBtn+="\t\t"+"'CoordX':'0',"+"\n";
			OneBtn+="\t\t"+"'CoordY':'0',"+"\n";
			OneBtn+="\t\t"+"'Groups':'[0]',"+"\n";
			OneBtn+="\t"+'},'+"\n";
			OneBtn='var '+pPt+'=['+"\n"+OneBtn+'];'+"\n";
			OneBtn={};
			OneBtn['Name']='New';
			OneBtn['CoordX']='0';
			OneBtn['CoordY']='0';
			OneBtn['Groups']='[0]';
			self[pPt]=[];
			self[pPt].push(OneBtn);
			//
		}
	});
	$('#flyaoMenu .list-group-item .newpoint').on('click',(event)=>{
		//Новая точка
		var desc = prompt("Описание:", 'new');
		var group = prompt("Номер группы:",0);
		//Координаты - центр карты
		var mainpic=$('#mainpic');
		var curscale=1;
		if (typeof(Profiles[profileIndex].zoom)!=undefined){
			//
			curscale=Profiles[profileIndex].zoom;
		}
		//суть в том что zoom реально увеличивает как сказано, но jq показывает размер без зума.
		//но точка поставленная в конец реальной ширины будет ровно с этой шириной, но трансформация центральной картинки увеличивает точку
		//для уменьшения её к 20*20 используем обратный зум, но при этом она смещается, но это не влияет на координаты точки
		//причем - 10 - пол ширины ощушается как полная ширина при зуме 1.9 - зум влияет и надо вычитать ещё меньше согласно зуму.
		//проверил что зум вообще никак не влияет - 10 отлично работает как с зумом точки так и без
		//var coordX=0;coordY=0;
		var coordX=(mainpic.width()-20)/2;
		//var coordX=(mainpic.width()*(curscale))/2-(20/2);
		var coordY=(mainpic.height()-20)/2;
		//var coordY=(mainpic.height()*(curscale))/2-(20/2);	
		//в памяти
		if (desc && group){
			self[Profiles[profileIndex].pointarr].push({'Name':desc,'CoordX':coordX+'px','CoordY':coordY+'px','Groups':'['+group+']'});
			pointsarr.push({'Name':desc,'CoordX':coordX+'px','CoordY':coordY+'px','Groups':'['+group+']'});
			//перезагрузим грузим профиль ? profileSelect(profileIndex)
			//Новый номер
			var numi=mainpic.find('.mycircle').length;
			//не с 0
			if (Profiles[profileIndex].StartIndex>0){
				numi+=Profiles[profileIndex].StartIndex;
			}
			//в списке
			placelisttext(group,desc,numi,1,1);
			UpdateCountGr(group);
			//на карте
			var bonusClass='';
			//Добавляем очищалку стиля для групп точек
			var tmpgroup=$('.maingroups .list-group-item:not(.autohist)').eq(group);
			if (tmpgroup.get(0).hasAttribute('custombg') || tmpgroup.get(0).hasAttribute('customstyle')){
				//очищалка
				//mainpic.find('.cg'+z).addClass('ClearCg');
				bonusClass='ClearCg';
			}
			//Новая кнопка
			placebtn(coordX,coordY,numi,desc,0,group,bonusClass);
		}
	});
	$('#flyaoMenu .list-group-item .newgroup').on('click',(event)=>{
		//Новая группа
		var el=$(event.target);
		var newGropuString='';
		var pName = prompt("Название:", event.target.title);
		var newIndex=profileIndex;
		if (pName && pName!==false && !pName.match(/^[^A-zА-я\w\d\s_-]*$/)
			){
			newGropuString="<div href=\"#\" class=\"list-group-item\"> \t\t<h4 class=\"list-group-item-heading\"><span class=\"icon\"></span><span class=\"text\">&nbsp;"+pName+"</span></h4> \t\t</div> \t\t";
			//no data
			if (typeof(Profiles[profileIndex])!='undefined' && Array.isArray(Profiles[profileIndex]['GpoupList']) ){
				Profiles[profileIndex]['GpoupList'].push(pName);
				//Отобразим группу
				profileSelect(profileIndex);
			}
		}
	});	
	$('#flyaoMenu .list-group-item .ignordel').on('click',(event)=>{
		//Удаляем игнор лист
		globIgnore=[];
		//update ignore
		setCookie(IgnoreName,JSON.stringify(globIgnore),{expires:60*60*24*30,path:'/'})
		if (typeof(routeShow)!='undefined' && routeShow){
			//маршрут включен и это двигается центральная картинка или точка маршрута, обновляем позиции
			//refreshRoute();
			DeleteRoute();
			CreateRoute();
		}
		event.preventDefault();
	});	
	$('#flyaoMenu .list-group-item .compress').on('click',(event)=>{
		//Сжать
		//var el=$(event.target);
		var newrect={'left':999999,'top':999999,'right':0,'bottom':0};
		var tmpel={};
		var newpoint={'x':0,'y':0};
		var compressArr;
		if (selectedArr.length){
			compressArr=selectedArr;
		}
		else{
			compressArr=$('#mainpic .mycircle').not('.hide');
		}
		$(compressArr).each(function(){
			//tmpel=$(this).offset();
			tmpel.left=parseInt($(this).css('left'))
			tmpel.top=parseInt($(this).css('top'))
			if (newrect.left >= tmpel.left){
				newrect.left = tmpel.left;
			}
			if (newrect.top >= tmpel.top){
				newrect.top = tmpel.top;
			}
			if (newrect.right <= tmpel.left){
				newrect.right = tmpel.left;
			}
			if (newrect.bottom <= tmpel.top){
				newrect.bottom = tmpel.top;
			}
		});
		newpoint.x=parseInt(newrect.left+(newrect.right-newrect.left)/2);
		newpoint.y=parseInt(newrect.top+(newrect.bottom-newrect.top)/2);
		$(compressArr).each(function(){
			this.style.left=newpoint.x+'px';
			this.style.top=newpoint.y+'px';
		});
	});	
	$('.langSelect .list-group-item').on('click',function(){
		var el=$(this);
		//select one
		el.siblings().removeClass('active');
		//on this
		el.toggleClass('active');
		defaultLang=this.innerText.trim();
		globSettings['lang']=defaultLang;
		//меняем язык
		langSelect(defaultLang);
		//hide tab
		el.parent().toggleClass('hide');
		//обновляем настройки
		localStorage.setItem(settingsName, encodeURIComponent(JSON.stringify(globSettings)));
		//перезагружаем карту
		loadMAPSettings(defaultLang).then((result1) => {
			//Выводим группы
			$('#flyProf .list-group-item').not('.custom').remove();
			$('#flyProf .mainfly').append(wrapGroups());
			profileSelect(defaultProfile);
		})
	});
	$('#flycMenu .list-group-item-text').on('click',function(event){
		let zobj=this.dataset.action;
		let el=$(this);
		if (el.hasClass('active')){
			el.removeClass('active');
			if (zobj){
				//keymove=0;
				self[zobj]=0;
			}
			if (zobj=='invIndex'){
				//0
				$('#mainpic .mycircle').css('z-index','');
			}
			if (zobj=='routeShow'){
				//удаляем маршрут
				DeleteRoute();
			}
			if (zobj=='drawLines'){
				//уже не рисуем направляющие линии
				//console.log('drawlines');
				tmpPointsDx={};
				tmpDirectrix=null;
				maptarget=null;
				self[zobj]=0;
				$('.drawingTools').hide();
				$('#flylist .maingroups').toggleClass('hide');
			}			
		}
		else
		{
			el.addClass('active');
			if (zobj){
				//keymove=1;
				self[zobj]=1;
			}
			if (zobj=='invIndex'){
				//1
				var maxindex=pointsarr.length;
				$('#mainpic .mycircle').each(function(){
					var curnum=parseInt($(this).attr('id').replace(preId,''));
					$(this).css('z-index', maxindex-curnum);
				});
			}
			if (zobj=='routeShow'){
				//строим маршрут
				CreateRoute();
			}
			if (zobj=='drawLines'){
				//рисуем направляющие линии
				//обнуляем чтобы они были первыми
				tmpPointsDx={};
				tmpDirectrix=null;
				maptarget=$('#mainpic');
				self[zobj]=1;
				dLSelected=dLSelectDefault;
				//выделяем
				dLSelect(dLSelected);
				$('.drawingTools').show();
				//убираем группы
				$('#flylist .maingroups').toggleClass('hide');
				//console.log('draw lines on');
			}
		}
	})
	$('.drawingToolsSetup .drawSetItem').on('click',function(e){
		//left click
		var el=$(this);
		var dataKey;
		var dataVal;
		if (e.target.tagName!='INPUT' && !e.target.classList.contains('mark')){
			dataKey=el.data('key');
			if (dataKey=='middleLabel'){
			//{color: 'red'})
				dataVal=el.find('input').val();
				if (dataVal.length){
					//leaderLineOptions[dataKey]=dataVal;
					let labelColor=$('.drawingToolsSetup .mark.labelColor').data('color');
					leaderLineOptions[dataKey]={text: dataVal, color: labelColor};
				}
			}
			el.find('.setOptions').toggleClass('active');
		}
	});
	$('.drawingToolsSetup .drawSetItem .glabel').on('click',function(e){
		//left click
		var el=$(this);
		//var dataKey;
		el.siblings('input').click();
	});
	$('.drawingToolsSetup .drawSetItem.grad input').on('click',function(e){
		var el=$(this);
		var parentEl=el.parent();
		var elInput=parentEl.find('input');
		var checkStatus=elInput.prop('checked');
		
		if (checkStatus){
			//да
			let StartColor=$('.drawingTools .setColors .first .mark').data('color');
			let EndColor=lineColor=$('.drawingTools .setColors .back .mark').data('color');
			
			parentEl.addClass('active');
			
			parentEl.css('background',EndColor);
			parentEl.css('background','linear-gradient(90deg, '+StartColor+' 0%, '+EndColor+' 100%)');
			
			leaderLineOptions[parentEl.data('key')]=true;
		}else{
			parentEl.removeClass('active');
			parentEl.css('background','inherit');
			
			leaderLineOptions[parentEl.data('key')]=false;
		}
		
	});
	$('.drawingToolsSetup .setOptions .option').on('click',function(e){
		//left click
		var el=$(this);
		var par=el.closest('.setOptions');
		var dataVal;
		var dataKey;
		
		dataKey=par.data('key');
		dataVal=el.data('value');
		if (dataVal=='input'){
			return;
		}
		
		//переключение активности
		par.find('.option').removeClass('active');
		el.addClass('active');
		par.removeClass('active');
		
		e.stopPropagation();
		
		//Ставим что должны	
		
		if (dataVal.length && dataKey.length){
			//Значения есть			
			leaderLineOptions[dataKey]=dataVal;
		}
	});
	$('.drawingTools .groupWpap2cl .drawItem').on('contextmenu',function(e){
		//contextmenu
		e.preventDefault();
		e.stopPropagation();
		//return false;
	});
	$('.drawingTools .groupWpap2cl .drawItem').on('mouseup',function(e){
		if (e.button==2){
			//right click
			e.preventDefault();
			e.stopPropagation();
			/*console.log ('button '+e.button);*/
			$('.drawingToolsSetup').toggleClass('active');
			//return false;
		}else{
			//console.log ('button '+e.button);
		}
	});
	$('.drawingTools .groupWpap2cl .drawItem').on('click',function(){
		//выбрали инструмент, выделяем, только левый клик
		dLSelect(null,$(this));
	});
	function dLSelect(index=null,drawObj=null){
		var dTools=$('.drawingTools .groupWpap2cl .drawItem');
		if (!index && drawObj){
			index=dTools.index(drawObj);
			//console.log(index);
		}
		dLSelected=index;
		dTools.removeClass('selected');
		dTools.eq(index).addClass('selected');
	}
	function drawLineTmp(x1,y1,x2,y2){
		var curscale=Profiles[profileIndex].zoom;
		
		switch (dLSelected){
		case 0:
		//временная линия
			if (tmpDirectrix!=null && tmpDirectrix){
				//перерисовываем
				tmpDirectrix=correctLineStraight(tmpDirectrix,x2*curscale,y2*curscale);
			}
			else
			{
				//первый раз рисуем
				tmpDirectrix=drawLineStraight(x1*curscale,y1*curscale,x2*curscale,y2*curscale);
			}
		break;
		case 1:
		//постоянная линия
			if (tmpDirectrix!=null && tmpDirectrix){
				//перерисовываем
				tmpDirectrix=correctLineStraight(tmpDirectrix,x2*curscale,y2*curscale);
				//вот тут корректируем конечные координаты
				arrPLines[arrPLines.length - 1]['x2']=x2*curscale;arrPLines[arrPLines.length - 1]['y2']=y2*curscale;
			}
			else
			{
				//первый раз рисуем
				tmpDirectrix=drawLineEx(x1*curscale,y1*curscale,x2*curscale,y2*curscale);
			}
		break;
		}
	}
	function correctLineStraight(obj,x2,y2){
		var mapPic=document.getElementById('mainpic');
		var elend=LeaderLine.pointAnchor(mapPic, {x: x2, y: y2});
		return obj.setOptions({end:elend});
	}
	function drawLineStraight(x1,y1,x2,y2,lineColor='none'){
		//временная прямая линия
		
		if (lineColor=='none'){
			lineColor=$('.drawingTools .setColors .back .mark').data('color');
		}
		
		var mapPic=document.getElementById('mainpic');
		
		var elStart=LeaderLine.pointAnchor(mapPic, {x: x1, y: y1});
		var elend=LeaderLine.pointAnchor(mapPic, {x: x2, y: y2});
		return new LeaderLine(
			{
				start:elStart,
				end:elend,
				path:'straight',
				color:lineColor,
				dash: true,
				endPlug:'behind',
			}
		)
	}
	function drawLineEx(x1,y1,x2,y2){
		//постоянная линия
		var mapPic=document.getElementById('mainpic');
		var elStart={};
		var elend={};
		var lineOptions={};
		var lineOptionsArr={}; // временный массив для запоминания

		//это постоянная линия, записываем координаты во временный массив, а потом в общий массив линий
		lineOptionsArr['x1']=x1;lineOptionsArr['y1']=y1;
		lineOptionsArr['x2']=x2;lineOptionsArr['y2']=y2;
		
		//начальные координаты
		elStart=LeaderLine.pointAnchor(mapPic, {x: x1, y: y1});
		elend=LeaderLine.pointAnchor(mapPic, {x: x2, y: y2});

		//цвет и другие опции
		lineColor=$('.drawingTools .setColors .back .mark').data('color');
		lineOptions['start']=elStart;
		lineOptions['end']=elend;
		lineOptions['color']=lineColor;
		
		//merge опций по умолчанию и тех что уже есть
		lineOptions={ ...lineOptions, ...leaderLineOptions };
		
		//merge опций временного массива и тех что выводятся
		lineOptionsArr={...lineOptions,...lineOptionsArr};
		lineOptionsArr['start']=undefined;
		lineOptionsArr['end']=undefined;
		
		//преобазование некоторых опций
		if (lineOptions['middleLabel']!=undefined){
			lineOptions['middleLabel']=LeaderLine.captionLabel({text: lineOptions['middleLabel']['text'], color: lineOptions['middleLabel']['color']});
		}
		if (lineOptions['gradient']!=undefined && lineOptions['gradient']==1){
			let StartColor=$('.drawingTools .setColors .first .mark').data('color');
			lineOptions['startPlugColor']=StartColor;
			lineOptions['endPlugColor']=lineColor;
		}
		
		
		//это постоянная линия, запоминаем её.
		arrPLines.push(lineOptionsArr);

		return new LeaderLine(lineOptions);
	}
	
	function DeleteRoute(){
		RouteLines.forEach(function(element){
			element.remove();
		});
		RouteLines=[];
	}
	function refreshDirectrix(){
		for (elLine in directrix){
			directrix[elLine].position();
		}
	}
	function refreshRoute(){
		var tmphide=[];
		RouteLines.forEach(function(element){
			if (element.start.classList.contains('hide')){
				tmphide.push(element.start);
				element.start.classList.remove('hide');
			}
			//Re-position the leader line with current position and size of the elements as start or end option.
			element.position();
		});
		tmphide.forEach(function(element){
			element.classList.add('hide');
		});
	}
	function CreateRoute(){
		//Получаем новый маршрут
		var routes=GetCurRoute();
		var prevElem=null;
		var tmphide=[];
		/*
			path:
			straight
			arc
			fluid - default
			magnet
			grid
		*/
		//Стоим новые маршруты
		routes.curRoute.each(function(){
			if (prevElem){
				if (prevElem.classList.contains('hide')){
					tmphide.push(prevElem);
					prevElem.classList.remove('hide');
				}
				RouteLines.push(new LeaderLine(
					{start:prevElem,end:this,dropShadow: true,path:'straight',gradient: true,startPlugColor: '#ded35d',endPlugColor:'#E67146',color:'#FF7F4F'}
				));
			}
			prevElem=this;
		});

		//скрываем
		tmphide.forEach(function(element){
			element.classList.add('hide');
		});
	}
	function GetCurRoute(){
		//вычитаем игнор лист
		var ignoreList=[];
		//.not('#mapoint2,#mapoint3')
		globIgnore.forEach(function(element){  let arrelem=element.split(profSym);if (arrelem[1]==self['Profiles'][profileIndex].pointarr){ ignoreList.push('#'+preId+arrelem[0]);} });
		//вычисляем маршрут
		var curRoute=$('#mainpic .mycircle').not('.hide').not(ignoreList.join(',')).slice(0,defRouteCount);
		//var curRoute={};
		/*curRouteOld.each(function(){
			var dataIdFull=this.id+profSym+self['Profiles'][profileIndex].pointarr;
			//Проверка если в игнор листе
			if (!globIgnore.includes(dataIdFull)){
			curRoute=jQuery.merge($(this),curRoute);
			}
		});*/
		var options={};
		//добавляем историю
		if (globhist!==null && globhist.length){
			var lastHist=globhist[globhist.length-1].split(profSym);
			//и если это текущий профиль то добавляем элемент в список
			if (lastHist[1]==self['Profiles'][profileIndex].pointarr){
				var dataIdFull=lastHist[0]+profSym+self['Profiles'][profileIndex].pointarr;
				//Проверка если в игнор листе
				if (!globIgnore.includes(dataIdFull)){
					curRoute=jQuery.merge($('#'+lastHist[0]),curRoute)
					options.firstHist=1;
				}
			}
		}
		return {curRoute:curRoute,options:options};
	}
	$('#tmpContMenu .list-group-item .chgroup').on('click',function(e){
		//старый номер группы
		var parentel=$(this).closest('#tmpContMenu');
		var numi=parentel.data('itemId');
		console.log(numi);
		var objMetka=$('#mainpic').find('#'+preId+numi);
		var tmpGroup;
		//ищем прошлую группу в pointsarr по номеру и от туда берем номер группы
		try {
			tmpGroup=$.parseJSON(pointsarr[numi-1].Groups);
			tmpGroup=(tmpGroup.length)?tmpGroup[0]:0;
		}
		catch(e) {
			console.log('Не удалось определить группу');
			tmpGroup=null;
		}
		var group = prompt("Номер группы:", tmpGroup);
		var clsActive,clsHide,olddesc;
		if (group != null && tmpGroup!==null) {
			//Находим старую запись и удаляем её
			var flylist=$('#flylist');
			var curfly=flylist.find('.list-group-item:eq('+tmpGroup+') .list-group-item-text');
			curfly.each(function(index,element) {
				if ($(this).data('id')==preId+numi){
					//Нашли, удаляем
					clsActive=$(this).hasClass('active');
					clsHide=$(this).hasClass('hide');
					olddesc=objMetka.attr('title');
					$(this).remove();
					//добавляем новую запись в другую группу но с тем же номером
					placelisttext(group,olddesc,numi,clsActive,clsHide);
					UpdateCountGr(tmpGroup);
					UpdateCountGr(group);
					//А также обновляем сведениия в pointsarr
					pointsarr[numi-1].Groups='['+group+']';
					//А также меняем класс точки
					objMetka.removeClass('cg'+tmpGroup).addClass('cg'+group);
					//убираем меню
					parentel.toggleClass('hide');
					return false;
				}
			});
		}
	});
	$('#tmpContGroupMenu .list-group-item .groupmove').on('click',function(e){
		//перемещаем группу
		//само меню
		var tmpCont=$(this).closest('#tmpContGroupMenu');
		//Найдем группу, индекс
		var groupIndex=tmpCont.data('itemIndex');
		//Где расположена сама группа
		var par=$('.maingroups .list-group-item').not('.autohist').eq(groupIndex);
		//Включаем особый режим чтобы при наведении выделялось
		moveGroup=1;
		tmpCont.addClass('hide');
	})
	$('#tmpContGroupMenu .list-group-item .groupremove').on('click',function(e){
		//Удалим группу
		var tmpCont=$(this).closest('#tmpContGroupMenu');
		//Найдем группу
		var groupIndex=tmpCont.data('itemIndex');
		var par=$('.maingroups .list-group-item').not('.autohist').eq(groupIndex);
		if (groupIndex>=0){
			if (confirm('Удалить / delete ?')) {
				//удаляем в памяти
				if (Array.isArray(Profiles[profileIndex].GpoupList)){
					Profiles[profileIndex].GpoupList.splice(groupIndex, 1);
				}
				else{
					console.log('error delete');
				}
				
				//удаляем в списке
				if (par.length){
					par.remove();
				}
			}
		}
		event.preventDefault();
		//close menu
		tmpCont.addClass('hide');
		//return;
	});
	$('#tmpContMenu .list-group-item .toIgnore').on('click',function(e){
		var parentel=$(this).closest('#tmpContMenu');
		var dataid=parentel.data('itemId');
		var dataIdFull=dataid+profSym+self['Profiles'][profileIndex].pointarr;
		//Проверка
		if (!globIgnore.includes(dataIdFull)){
			//добавление в игнор лист
			globIgnore.push(dataIdFull);
			//update ignore
			setCookie(IgnoreName,JSON.stringify(globIgnore),{expires:60*60*24*30,path:'/'})
			if (typeof(routeShow)!='undefined' && routeShow){
				//маршрут включен и это двигается центральная картинка или точка маршрута, обновляем позиции
				//refreshRoute();
				DeleteRoute();
				CreateRoute();
			}					
		}
		event.preventDefault();
		parentel.addClass('hide');
	});
	$('#tmpContMenu .list-group-item .delpoint').on('click',function(e){
		//удаляем точку на карте
		//старый номер группы
		var parentel=$(this).closest('#tmpContMenu');
		var numi=parentel.data('itemId');
		var el=$('#'+preId+numi);
		if (el.length){
			//удаляем саму точку на карте
			el.remove();
			//удаляем запись в списке групп
			var tmpGroup;
			//ищем прошлую группу в pointsarr по номеру и от туда берем номер группы
			try {
				tmpGroup=$.parseJSON(pointsarr[numi-1].Groups);
				tmpGroup=(tmpGroup.length)?tmpGroup[0]:0;
			}
			catch(e) {
				console.log('Не удалось определить группу');
				tmpGroup=null;
			}
			var flylist=$('#flylist');
			var curfly=flylist.find('.list-group-item:eq('+tmpGroup+') .list-group-item-text');
			curfly.each(function(index,element) {
				if ($(this).data('id')==preId+numi){
					//Нашли, удаляем
					$(this).remove();
					return false; //break;
				}
			});
			parentel.toggleClass('hide');
			//удаляем её из истории - не сильно надо.
		}
	});
	$('#mainpic').mousedown(function(event){
		var searchstr='';
		$('#flycMenu').addClass('hide');
		$('#flyaoMenu').addClass('hide');
		//console.log(event);
		if (event.target.className.indexOf('mycircle')>=0){mapcircle=1;}
		if (event.shiftKey && mapcircle==1 && !gsize){
			//хотим изменить маркер
			var desc = prompt("Описание:", event.target.title) || event.target.title;
			if (desc != null) {
				event.target.title=desc;
			}
		}
		else if(event.ctrlKey && mapcircle==1 && !gsize){
			//Меняем группу, не меняем, будем выводить меню с выбором
			let el=$('#tmpContMenu');
			let elh=el.outerHeight();
			let menuheight=0;
			el.toggleClass('hide');
			el.css('left',event.pageX+'px');
			menuheight=event.pageY;
			//далее передвигаем с учетом экрана, если позволяет - справа от курсора, если нет - справа будет низ меню
			if (event.pageY+elh>$('body').height()){
				menuheight-=elh;
			}
			el.css('top',menuheight+'px');			
			el.data('itemId',$(event.target).attr('id').replace( /[^\d]/g, "" ));
		}
		if (event.ctrlKey && mapcircle==0){
			//активация лупы подсказки
			//console.log(event);
			//activate circlept
			if (circlept){
				//отключаем
				circlept=0;
				maptarget.toggleClass('active');
				maptarget=null;
				mapposx=null;
			}
			else
			{
				if (!event.target.classList.contains('mycircle')){
					circlept=1;
					maptarget=$('.objcirclept');
					maptarget.toggleClass('active');
					//console.log('down ctrl act='+maptarget.hasClass('active'));
				}
			}
		}
		if (event.shiftKey && !mapcircle && !drawLines){
			//Режим выделения
			if (Selectpt){
				if (selectedArr.length){
					selectedArr=selectedArr.add(inWindow(maptarget,$('#mainpic .mycircle').not('.hide')));
				}
				else{
					selectedArr=inWindow(maptarget,$('#mainpic .mycircle').not('.hide'));
				}
				Selectpt=0;
				$(selectedArr).addClass('ptSelect');
				//console.log(maptarget.get(0).getClientRects());
				maptarget.toggleClass('active');
				maptarget=null;
			}
			else{
				/*if (selectedArr.length){
					$(selectedArr).removeClass('ptSelect');
				}*/
				Selectpt=1;
				maptarget=$('.selectpt');
				maptarget.toggleClass('active');
				maptarget.css('left',event.pageX+'px');
				maptarget.css('top',event.pageY+'px');
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
				if (selectedArr.length){
					searchstr=selectedArr;
				}
				else
				{
					searchstr=$('#mainpic .mycircle');
				}
				$(searchstr).each(function(){
					let tmpel=$(this);
					let elx=parseInt(tmpel.css('left')),ely=parseInt(tmpel.css('top'));
					gTmpArr[tmpel.attr('id')]={'left':elx,'top':ely};
					//gsize запомним расстояния от текущей точки
					if (gsize){
						//old=cx-selx
						gTmpArr[tmpel.attr('id')]={'left':elx-mapposcx,'top':ely-mapposcy};
					}
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
		var mainpic=$('#mainpic');
		var curscale=Profiles[profileIndex].zoom;
		mainpic.removeClass('active');
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
			//ищем его в pointsarr по номеру и от туда берем номер группы
			try {
				tmpGroup=$.parseJSON(pointsarr[tmpGroup-1].Groups);
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
				var numi=mainpic.find('.mycircle').length;
				//не с 0
				if (Profiles[profileIndex].StartIndex>0){
					numi+=Profiles[profileIndex].StartIndex;
				}
				pointsarr.push({'Name':desc,'CoordX':oldx+'px','CoordY':oldy+'px','Groups':'['+group+']'});
				//надо ставить уже активный маркер
				//Новый текст
				placelisttext(group,desc,numi,1,1);
				UpdateCountGr(group);
				var bonusClass='';
				//Добавляем очищалку стиля для групп точек
				var tmpgroup=$('.maingroups .list-group-item:not(.autohist)').eq(group);
				if (tmpgroup.get(0).hasAttribute('custombg') || tmpgroup.get(0).hasAttribute('customstyle')){
					//очищалка
					//mainpic.find('.cg'+z).addClass('ClearCg');
					bonusClass='ClearCg';
				}
				////////
				//Новая кнопка
				placebtn(oldx,oldy,numi,desc,0,group,bonusClass);
			}
		}
		if (drawLines && mapcircle==0){
			//запоминаем точку
			if (tmpPointsDx.x1!=undefined && tmpDirectrix!=null){
				//не первая - ставим окончательно и рисуем
				//не перерисовываем - не будет выравнивания
				//и ставим
				directrix.push(tmpDirectrix);
				tmpDirectrix=null;
				//console.log('set end point');
				tmpPointsDx.x1=undefined;
			}
			else{
				//console.log('set first point');
				//если только кликаем по изображению а не по меню.
				if (event.target.tagName=="IMG"){
					//нужны координаты относительно картинки
					//var curscale=Profiles[profileIndex].zoom;
					tmpPointsDx.x1=event.offsetX;
					tmpPointsDx.y1=event.offsetY;
				}
			}
		}
		if ((event.ctrlKey && event.shiftKey) && mapposcx && mapposx && !circlept && maptarget!=null ){
			//Отмена, возвращаем старые координаты
			maptarget.css('left',mapposcx+'px');
			maptarget.css('top',mapposcy+'px');
			mapposx=null;
			event.preventDefault();
		}
		if (mapcircle==1){mapcircle=0;maptarget=null;gTmpArr={};}
		//не отключаем перемещение если это точечный круг или круг выделения
		if (!circlept && !Selectpt){
			mapposx=null;
		}
		return false;
	});
	$('.selectpt').mousemove(function(event){
		//если зашли в область выделения
		if (Selectpt==1){
			//и включено выделение
			if (mapposx!=null){
				var cx=0;
				var cy=0;
				cx=(event.pageX-mapposx);
				cy=(event.pageY-mapposy);
				maptarget.css('width',cx+'px');
				maptarget.css('height',cy+'px');
			}
		}
	});
	$('#mainpic').mousemove(function(event){
		var curscale=1;
		var element = document.querySelector('#mainpic');
		var scaleX = element.getBoundingClientRect().width / element.offsetWidth;
		var curscale=Profiles[profileIndex].zoom;
		
		if ($(this).hasClass('active') || circlept || Selectpt || drawLines){
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
			else if (Selectpt==1){
				//прямоугольник выделения
				mainpic=null
				//перемещаем точку 2
				if (mapposx!=null && maptarget){
					var cx=0;
					var cy=0;
					cx=(event.pageX-mapposx);
					cy=(event.pageY-mapposy);
					maptarget.css('width',cx+'px');
					maptarget.css('height',cy+'px');
				}
			}
			else if (drawLines && event.target.tagName=="IMG"){
				//это мы в процессе рисования временной линии
				mainpic=null;
				//перемещаем точку 2
				if (tmpPointsDx.x1!=undefined && maptarget && mapposx!=0){
					//мы должны прорисовать линию от старых координат до новых, но возможно стоит только точки обновить.
					var xEnd=event.offsetX;
					var yEnd=event.offsetY;
					if (event.shiftKey){
						var cx=Math.abs(xEnd-tmpPointsDx.x1);
						var cy=Math.abs(yEnd-tmpPointsDx.y1);
						//распрямляем
						//по идее нам надо вычислить расстояния x2-x1 y2-y1
						if (cx<=cy){
							//и какое меньше, допустим x - выравниваем по горизонтали, усредняем x
							xEnd=tmpPointsDx.x1;
						}else{
							yEnd=tmpPointsDx.y1;
						}
					}
					drawLineTmp(tmpPointsDx.x1,tmpPointsDx.y1,xEnd,yEnd);
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
							if (gcy>gcx){
								gcx=gcy;
							}
							else{
								gcy=gcx;
							}
						}
						//console.log('Рост у.е. '+gcx);
					}
					else if (gmove)
					{
						//Двигаем все координаты
						gcx=event.pageX-mapposx;
						gcy=parseInt(event.pageY)-mapposy;
					}
					if (Object.keys(gTmpArr).length){
						for (let keyindex of Object.keys(gTmpArr)) {
							var tmpel=$('#'+keyindex);
							if (gsize){
								//x=selx+(old*a)
								cx=mapposcx+gTmpArr[tmpel.attr('id')].left*(gcx+1);
								cy=mapposcy+gTmpArr[tmpel.attr('id')].top*(gcy+1);
								//console.log('Итог '+cx);
							}else
							{
								cx=gTmpArr[tmpel.attr('id')].left+gcx;
								cy=gTmpArr[tmpel.attr('id')].top+gcy;
							}
							tmpel.css('left',cx+'px');
							tmpel.css('top',cy+'px');
						}
					}
				}
				else
				{
					//тоже mapcircle, но не глобальное
					//Корректировка на основе zoom
					if (mapcircle){
						curscale=scaleX;
						cx=mapposcx+(event.pageX-mapposx)/curscale;
						cy=mapposcy+(event.pageY-mapposy)/curscale;
					}
					if (mainpic){
						mainpic.css('left',cx+'px');
						mainpic.css('top',cy+'px');
						//Также обновляем временные линии (даже если не включены маршруты)
						refreshDirectrix();
					}
					if (typeof(routeShow)!='undefined' && routeShow){
						//маршрут включен и это двигается центральная картинка или точка маршрута, обновляем позиции
						refreshRoute();
					}
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
		if (!wnd){console.log('warning, wnd is null');return [];}
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
	});
	$('#mainpic').dblclick(function(event){
		if (event.target.className.indexOf('mycircle')>=0){
			//дабл клик по кругу - ищем его id в списке и тыкаем по иконке.
			var newid=event.target.id;
			var flylist;
			flylist=$('#flylist .list-group-item .list-group-item-text');
			//console.log(newid);
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
	$('.maingroups').on('click','.list-group-item .list-group-item-heading .text',function(){
		var el=$(this);
		var newselarr=[];
		//var par=el.parent().parent(); //.list-group-item
		var par=el.closest('.list-group-item');
		if (event.shiftKey){
			//Выделяем точки группы
			par.find('.list-group-item-text').each(function(){
				mapelem=$('#'+$(this).data('id')).get(0);
				selectedArr.push(mapelem);
			});
			$(selectedArr).addClass('ptSelect');
			event.preventDefault();
			return;
		}
		if (event.ctrlKey){
			//будем выводить меню с выбором
			if (moveGroup){
				//отмена перемещения
				moveGroup=0;
				return;
			}
			else if (!par.hasClass('autohist')){
				let el=$('#tmpContGroupMenu');
				let elh=el.outerHeight();
				let menuheight=0;
				el.toggleClass('hide');
				el.css('left',event.pageX+'px');
				menuheight=event.pageY;
				//далее передвигаем с учетом экрана, если позволяет - справа от курсора, если нет - справа будет низ меню
				if (event.pageY+elh>$('body').height()){
					menuheight-=elh;
				}
				el.css('top',menuheight+'px');			
				//Найдем группу
				let sibs=par.parent().find('.list-group-item').not('.autohist');
				let groupIndex=sibs.index(par);
				el.data('itemIndex',groupIndex);
				return;
			}
			}else if (event.altKey){
			//Переименовываем группу
			//Найдем группу
			var sibs=par.parent().find('.list-group-item').not('.autohist');
			var groupIndex=sibs.index(par);
			if (groupIndex>=0){
				var gOldText=Profiles[profileIndex].GpoupList[groupIndex].trim();
				//var gOldHtml=$(Profiles[profileIndex].GpoupList).find('.text').get(groupIndex).outerHTML;
				var gName = prompt("Название:", gOldText);
				if (gOldText!=gName && gName != null){
					//var gNewHtml=gOldHtml.replace(gOldText,gName);
					//заготовка готова, меняем в профиле, в памяти
					//Profiles[profileIndex].GpoupList=Profiles[profileIndex].GpoupList.replace(gOldHtml,gNewHtml);
					if (Array.isArray(Profiles[profileIndex].GpoupList)){
						Profiles[profileIndex].GpoupList[groupIndex]=gName;
					}
					else{
						console.log('error rename');
					}
					//меняем в списке
					el.html(el.html().replace(gOldText,gName));
				}
			}
			event.preventDefault();
			return;
		}
		if (moveGroup){
			par.removeClass('moveGroup');
			moveGroup=0;
			//Само перемещение
			//определить откуда
			let sibs=par.parent().find('.list-group-item').not('.autohist');
			let groupIndex=sibs.index(par);
			//определяем куда
			let GrFrom=$('#tmpContGroupMenu').data('itemIndex');
			let GrVal=Profiles[profileIndex].GpoupList[GrFrom];
			//лучше сначала вставлять, потом после вставленного дописать к следующим индексам 1, затем удалить
			//в памяти
			if (groupIndex<GrFrom){
				//уменьшение индекса - перемещаюсь выше
				Profiles[profileIndex].GpoupList.splice(groupIndex+1,0,GrVal);
				Profiles[profileIndex].GpoupList.splice(GrFrom+1,1);
				}else if (groupIndex>GrFrom){
				//новый индекс больше старого - перемещаюсь ниже
				Profiles[profileIndex].GpoupList.splice(groupIndex+1,0,GrVal);
				Profiles[profileIndex].GpoupList.splice(GrFrom,1);
				}else{
				//равно - вообще не перемещаюсь
			}
			//визуально
			//add
			/*let GrFromVis=GrFrom;
				if (groupIndex<GrFrom){
				GrFromVis+=1;
			}*/
			//лучше так не делать и копировать полностью
			//par.after(wrapMainGroups(GrVal));
			par.after(sibs.eq(GrFrom));
			//remove уже не нужно
			//sibs.eq(GrFromVis).remove();
			
			//перемещение групп точек в памяти
			
			//составим хеш массивы
			let startI=groupIndex;
			let endI=GrFrom;
			let myinc=1;
			//сначала середина
			if (groupIndex>GrFrom){
				//вниз
				startI=GrFrom;
				endI=groupIndex;
				myinc=-1;
			}
			let arrRename={};
			for (let z=startI+1;z<=endI;z++){
				arrRename[z]=z+myinc;
			}
			//конечные
			arrRename[GrFrom]=groupIndex;
			
			//цикл перемещения, в памяти менять бессмысленно, т.к. вся инфа собирает по точкам карты,
			//но суть в том что инфа по точкам и их группам собирается из групп слева, хотя и стоит того если мы захотим скакать с карты на карту
			for (tmppoint in self[Profiles[profileIndex].pointarr]) {
				//обычно одна группа
				let curG=JSON.parse(self[Profiles[profileIndex].pointarr][tmppoint].Groups)[0];
				if (arrRename.hasOwnProperty(curG)){
					//нашли совпадение по группе
					//self[Profiles[profileIndex].pointarr
					self[Profiles[profileIndex].pointarr][tmppoint].Groups=JSON.stringify([arrRename[curG]]);
				}
			}
			
		}
		else{
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
		}
	});
	$('#flylist').on('click','.list-group-item-text .icon',function(){
		var el=$(this);
		var par=el.parent(); //.list-group-item-text
		var groupnum=par.data('group');
		if (par.hasClass('active')){
			//Скрываем
			par.removeClass('active');
			$('#'+par.data('id')).addClass('hide');
			//off - add to history
			if (!par.parent().hasClass('autohist'))
			{
				//уже нельзя полагаться на profileIndex т.к. он меняется
				//var dataid=par.data('id')+profSym+profileIndex;
				//get number profile by pointarr
				var dataid=par.data('id')+profSym+self['Profiles'][profileIndex].pointarr;
				//Чтобы не было дублей
				if (globhist!==null && !globhist.includes(dataid)){
					var newel=$($.parseHTML(jQuery.trim(par.get(0).outerHTML)));
					newel.data('id',par.data('id'));
					newel.data('prof',self['Profiles'][profileIndex].pointarr);
					if (!$('#flylist .autohist .list-group-item-heading .text').hasClass('closed')){
						//скрывалось в истории когда она закрыта
						newel.removeClass('hide');
						}else{
						newel.addClass('hide');
					}
					newel.append($('<span class="icondel"></span>'));
					//$('#flylist .autohist').append(newel);
					$('#flylist .autohist').find('.list-group-item-heading').after(newel);
					//запись в историю
					globhist.push(dataid);
					//update history
					setCookie(historyName,JSON.stringify(globhist),{expires:60*60*24*30,path:'/'})
					if (typeof(routeShow)!='undefined' && routeShow){
						//маршрут включен и это двигается центральная картинка или точка маршрута, обновляем позиции
						//refreshRoute();
						DeleteRoute();
						CreateRoute();
					}					
				}
			}
			else
			{
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
				var histprof=par.data('prof');
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
	$('#flylist').on('click','.autohist .list-group-item-text',function(e){
		//console.log(e);
		if (e.shiftKey){
			if (movehist==1){
				movehist=0;
				//просто отмена
				$(this).removeClass('hMove');
			}
			else{
				//первый раз
				movehist=1;
				var el=$(this);
				var elstr=el.data('id')+profSym+el.data('prof');
				histMoveNum=globhist.indexOf(elstr);
			}
		}
		else{
			if (movehist==1){
				//перемещение
				movehist=0;
				var el=$(this);
				el.removeClass('hMove');
				var elstr=el.data('id')+profSym+el.data('prof');
				if (histMoveNum>=0 && elstr!=globhist[histMoveNum]){
					//удаляем первый элемент
					var elstr1=globhist[histMoveNum];
					//console.log(elstr1);
					globhist.splice(histMoveNum, 1);
					//console.log(globhist);
					//перемещаем историю
					var elpos=globhist.indexOf(elstr);
					if (elpos>=0){
						//нашли в истории, добавляем
						//console.log(elstr);
						globhist.splice(elpos, 0,elstr1);
						//console.log(globhist);
						$('#flylist .autohist .list-group-item-text').remove();
						loadhist();
						//update history
						setCookie(historyName,JSON.stringify(globhist));
					}
				}
			}
		}
	});
	$('#flylist').on({
		mouseenter: function () {
			if (moveGroup){
				var el=$(this);
				el.addClass('moveGroup')
			}
		},
		mouseleave: function () {
			if (moveGroup){
				var el=$(this);
				el.removeClass('moveGroup')
			}
		}
	}, ".list-group-item:not(autohist)");
	
	$('#flylist').on({
		mouseenter: function () {
			var el=$(this);
			$('#'+el.data('id')).addClass('highlight');
			if (movehist){
				el.addClass('hMove')
			}
		},
		mouseleave: function () {
			var el=$(this);
			$('#'+el.data('id')).removeClass('highlight');
			if (movehist){
				el.removeClass('hMove')
			}
		}
	}, ".list-group-item.autohist .list-group-item-text"); 
	//list-group-item
	$('#mainpic').on('mouseenter','.mycircle',function(){
		lastId=this.id;
	});
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
	$('.btall').on('click',function(e){
		var par=$('.list-group');
		var el=$(e.target);
		if (el.hasClass('langNow')){
			//ошибка, не тот уровень
			//el=el.parent();
			el=el.parents('.allon, .alloff');
		}
		if (el.hasClass('allon')){
			//active all
			var lhead=par.find('.list-group-item-heading').addClass('active');
			var ltext=par.find('.list-group-item-text').addClass('active');
			$('#mainpic .mycircle').removeClass('hide');
		}
		else if (el.hasClass('alloff'))
		{
			//deactivate all
			var lhead=par.find('.list-group-item-heading').removeClass('active');
			var ltext=par.find('.list-group-item-text').removeClass('active');
			$('#mainpic .mycircle').addClass('hide');
		}
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
	$('#flylist').on('click','.list-group-item.autohist .list-group-item-text .icondel',function(){
		//delete from history
		var par=$(this).parent();
		var dataid=par.data('id')+profSym+self['Profiles'][profileIndex].pointarr;
		par.remove();
		//Проверка
		if (globhist.includes(dataid)){
			//удаление из истории
			var tmpindex = globhist.indexOf(dataid);
			if (tmpindex > -1) {
				globhist.splice(tmpindex, 1);
			}
			//update history
			setCookie(historyName,JSON.stringify(globhist),{expires:60*60*24*30,path:'/'})
		}
	});
	
	$('.drawingTools .setColors .mark').on('click',function(){
		var elmark=$(this);
		var inputel=elmark.parents('.setColors').find('input[name=setcolors]');
		inputel.click();
		inputel.one('change',function(){
			var elinp=$(this);
			var color=elinp.val();
			elmark.data('color',color);
			elmark.css('background',color);
		});
	});
	/*$('.drawingTools .setColors .mark').on('click',function(){
		var elmark=$(this);
		var inputel=elmark.parents('.setColors').find('input[name=setcolors]');
		inputel.click();
		inputel.one('change',function(){
			var elinp=$(this);
			var color=elinp.val();
			elmark.data('color',color);
			elmark.css('background',color);
		});
	});*/
	$('.drawingToolsSetup .setOptions .mark').on('click',function(){
		var elmark=$(this);
		var inputel=elmark.parents('.setOptions').find('input.setcolors');
		inputel.click();
		inputel.one('change',function(){
			var elinp=$(this);
			var color=elinp.val();
			elmark.data('color',color);
			elmark.css('background',color);
		});
	});
	
	$('.helpp > div > h2').on('click',function(){
		$(this).next().toggleClass('hide');
	});
	$('.langSelect .langCh').on('click',function(){
		$(this).next().toggleClass('hide');
	});
	//searchbtn
	$('.searchbtn').on('click',function(){
		//Поиск
		$('.searchdlg').toggleClass('hide');		
	});
	$('.searchdlg input').on('keyup',function(event){
		var countpta,profi,curpta;
		q=$(this).val().toLowerCase();
		if (event.keyCode == 13 || q.length>2) {
			//Поиск
			var sresult=[];
			var otresult=[]; //поиск по неактивным профилям
			if (q.length){
				$('#mainpic .mycircle').each(function(){
					if ($(this).attr('title').toLowerCase().indexOf(q)!==-1){
						objsr={};
						objsr.profile=profileIndex;
						objsr.id=$(this).attr('id');
						sresult.push(objsr);
					}
				});
				//сделаем поиск по неактивным профилям
				var objotr;
				for (profi=0;profi<Profiles.length;profi++){
					if (profileIndex==profi){continue;}
					curpta=self[Profiles[profi].pointarr];
					for (i=0;i<curpta.length;i++){
						//Profiles[profi].pointsarr[i]
						if (curpta[i].Name.toLowerCase().indexOf(q)!==-1){
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
					//cce=$('#'+sresult[i]);
					//newid=cce.get(0).id;
					//у нас есть id - берем с маркеров на карте описания
					newel = $($.parseHTML( jQuery.trim(tmplist.replace(/#text#/gi, $('#'+sresult[i].id).attr('title')+" ("+sresult[i].id+")"))));
					newel.find('.icon').remove();
					newel.data('id',sresult[i].id);
					newel.data('profile',sresult[i].profile);
					newel.on('click',function(event){
						var profileCur=$(this).data('profile');
						var sibs=$('#flyProf .list-group-item');
						if (profileCur!=profileIndex){
							sibs.eq(profileCur+1).click();
							//Выключение истории
							$('#flylist .autohist .list-group-item-heading .icon').click();
						}
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
						var profileCur=$(this).data('profile');
						var sibs=$('#flyProf .list-group-item');
						if (profileCur!=profileIndex){
							sibs.eq(profileCur+1).click();
							//Выключение истории
							$('#flylist .autohist .list-group-item-heading .icon').click();
						}
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
		//устаревшее
		matches=[];
		matches[1]=localStorage.getItem(historyName);
		ret=matches ? decodeURIComponent(matches[1]) : undefined;
		return ret;
	}
	function setCookie(name, value, options={expires:60*60*24*30,path:'/'}) {
		//устаревшее
		value = encodeURIComponent(value);
		//document.cookie = updatedCookie;
		localStorage.setItem(name, value);
	}
	function deleteCookie(name) {
		//устаревшее
		localStorage.removeItem(name);
	}	
	//работа с куками
});																									 																														33