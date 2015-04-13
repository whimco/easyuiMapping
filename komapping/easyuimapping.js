/*
 * easyui与knockout的映射绑定
 * author:whimco
 */
(function($){	
	
	var easyuiMapping = {
		_uniqueName:0,       //起始值
		caching:{},          //缓存对象	
		plugins:{},          //插件
		//获取缓存的控件的唯一标识	
		getUniqueName:function(){                  
			this._uniqueName++;
	        return '' + this._uniqueName;
		},
		//缓存组件	
		cacheComponent:function(element, control){         
			var cacheKey = 'cmp-' + this.getUniqueName();
	        if (element) {
	            element.setAttribute('data-unique-name', cacheKey);
	            this.caching[cacheKey] = control;
	        }
		},
		//获取缓存的组件  
		getCachedComponent:function(element){         
			return this.caching[element.attributes['data-unique-name'].value];
		},
		//实例化组件
		createComponent : function (element, valueAccessor, allBindings, viewModel, bindingContext,controlType) {    
	    	var component = new ControlBase(element, valueAccessor, allBindings, viewModel, bindingContext,controlType);
	    	
	    	this.cacheComponent(element, component);	
	        return component;       
	    }	
	};  
    
    var ControlBase = function(element, valueAccessor, allBindings, viewModel, bindingContext,controlType){
		this.element = element;
		this.valueAccessor = valueAccessor();
		this.allBindings = allBindings;
		this.viewModel = viewModel;
		this.bindingContext = bindingContext;
		this.controlType = controlType;
		
		this.options = {};
		
		this.getOptions = function(){
            this.options = $(this.element).attr("data-options");
            if( this.options == undefined){
            	this.options = {};
            	return;
            }
            
            this.options  = eval("[{" + this.options + "}]")[0];
        };
        
        //扩展options和allBindings
        this.extendOptions = function(){
        	var self = this;
            var allBindings = this.allBindings();
            for(property in allBindings){
                //如果data-bind中的属性在$.fn.xxx.defaults中存在，则视为有效的属性。
                if($.fn[this.controlType].defaults.hasOwnProperty(property)){
                    //如果属性是ko的可观察对象，则取出其值，赋给options
                    if( ko.isObservable(allBindings[property])){
                        this.options[property] = allBindings[property]();
                        
                        //如果是基本类型，则直接赋值
                    }else if( typeof( allBindings[property]) == "string"
                           || typeof( allBindings[property]) == "boolean"
                           || typeof( allBindings[property]) == "number"
                           || typeof( allBindings[property]) == "object"
                           || typeof( allBindings[property]) == "array"){
                       this.options[property] = allBindings[property];
                       
                       //如果是方法，则使用闭包切换this对象，并赋值
                    }else if( typeof(allBindings[property]) == "function"){
                            var fun = (function(property){
                                return  function(arguments)
                                {                                          
                                    allBindings[property].call(self.viewModel,arguments);
                                };
                            })(property);
                           
                           this.options[property] = fun;
                    }
                }
            }
        };
        
        this.activeObservable = function(){
        	var self = this;
            var allBindings = this.allBindings();
            for(property in allBindings){
                //如果data-bind中的属性在$.fn.xxx.defaults中存在，则视为有效的属性。
                if($.fn[this.controlType].defaults.hasOwnProperty(property)){
                    //如果属性是ko的可观察对象，则取出其值，赋给options
                    if( ko.isObservable(allBindings[property])){
                        this.options[property] = allBindings[property]();
                    }
                }
                
                //如果是事件，则触发一下ko的通知。
                if(this.checkInMethods(this.controlType,property)){
                    if( ko.isObservable(allBindings[property])){
                        allBindings[property]();
                    }
                }
            }
        };
        
        //绑定通用默认事件
        this.bindDefaultEvents = function() {
        	var self = this;        	
        	var fun = null;
           
        	//保存外部设置的事件回调
        	if(this.options["onChange"]){
        	    fun = this.options["onChange"];
        	}
        	
        	if(self.valueAccessor && fun){
        	    this.options["onChange"] = function(newValue){
                    self.valueAccessor(newValue);
                    fun(newValue);
                };
        	}else if(self.valueAccessor){
        	    this.options["onChange"] = function(newValue){
                    self.valueAccessor(newValue);
                };
        	}else if(fun)
        	{
        	     this.options["onChange"] = function(newValue){
                    fun(newValue);
                };
        	}
        	
        };
        
        //绑定用户扩展的事件
        this.bindPluginInit = function() {
        	if(easyuiMapping.plugins[this.controlType] != undefined){
        		easyuiMapping.plugins[this.controlType].init.call(this);
        	}
        };
        
         //绑定用户更新的事件
        this.bindPluginUpdate = function(){
        	if(easyuiMapping.plugins[this.controlType] != undefined){
        		easyuiMapping.plugins[this.controlType].update.call(this);
        	}
        };
        this.depends = {            
            pagination:{ dependencies:['linkbutton']},
            datagrid:  { dependencies:['panel','resizable','linkbutton','pagination']},
            treegrid:  { dependencies:['datagrid']},
            propertygrid:{  dependencies:['datagrid']},
            datalist:  { dependencies:['datagrid']},           
            window:    { dependencies:['resizable','draggable','panel']},
            dialog:    { dependencies:['linkbutton','window']},
            messager:  { dependencies:['linkbutton','window','progressbar']},
            layout:    { dependencies:['resizable','panel']},            
            tabs:{       dependencies:['panel','linkbutton']},
            menubutton:{ dependencies:['linkbutton','menu']},
            splitbutton:{dependencies:['menubutton']},
            accordion:{  dependencies:['panel']},            
            textbox:{    dependencies:['validatebox','linkbutton']},
            filebox:{    dependencies:['textbox']},
            combo:{      dependencies:['panel','textbox']},
            combobox:{   dependencies:['combo']},
            combotree:{  dependencies:['combo','tree']},
            combogrid:{  dependencies:['combo','datagrid']},
            validatebox:{dependencies:['tooltip']},
            numberbox:{  dependencies:['textbox']},
            searchbox:{  dependencies:['menubutton','textbox']},
            spinner:{    dependencies:['textbox']},
            numberspinner:{dependencies:['spinner','numberbox']},
            timespinner:{dependencies:['spinner']},
            tree:{       dependencies:['draggable','droppable']},
            datebox:{    dependencies:['calendar','combo']},
            datetimebox:{dependencies:['datebox','timespinner']},
            slider:{     dependencies:['draggable']}
        };
        
        //检查是否依赖项中存在该方法
        this.checkInMethods = function(controlType,methodName){
            
            if(controlType == methodName) return false;
            
            if($.fn[controlType].methods.hasOwnProperty(property)){
               return true;
            }
           
            if(this.depends.hasOwnProperty(controlType)){
                var methods = this.depends[controlType].dependencies;
                for(var i=0;i<methods.length;i++){
                    if( this.checkInMethods(methods[i],methodName) ){
                        return true;
                    }
                }
            }          
           
            return false;
        };
        //如果是方法则返回
        this.getMethods = function(){
        	var methods = [];
        	var self = this;
            var allBindings = this.allBindings();
            for(property in allBindings){
                //如果data-bind中的属性在$.fn.xxx.defaults中存在，则视为有效的属性。
                if(this.checkInMethods(this.controlType,property)){
                    //如果属性是ko的可观察对象，则取出其值，赋给options
                    if( ko.isObservable(allBindings[property])){
                    	methods.push({method:property,param:allBindings[property]()});
                    }else
                    {
                    	methods.push({method:property,param:allBindings[property]});
                    }
                }
            }
            
            return methods;
        };
        //执行方法
        this.execMethods = function() {
        	var methods = this.getMethods();
			for(var i=0; i<methods.length; i++){				
				if(methods[i].param){
					$(this.element)[this.controlType](methods[i].method,methods[i].param);
				}
			}
        };
		
		this.init = function(){			               		
			this.getOptions();
			this.extendOptions();
			this.bindDefaultEvents();
			this.bindPluginInit();
			
			$(this.element)[this.controlType](this.options);				
		};
		
		this.update = function(){
			//更新可观察对象的值
			this.activeObservable();
			
			//刷新控件
			this.getOptions();
			this.extendOptions();
			this.bindDefaultEvents();
			//处理绑定的扩展操作
			this.bindPluginUpdate();
			
			$(this.element)[this.controlType](this.options);
			
			this.execMethods();
		};
	};
	
	window.easyuiMapping = window.easyuiMapping || easyuiMapping;
	
    //迭代生成绑定器
    for(control in $.fn){
		//$.fn中带defauls属性的插件，即为easyui的插件
		if($.fn[control].defaults == undefined){
			continue;
		}
		
		//动态生成ko的插件名称与easyui的插件名称保持一致
		 ko.bindingHandlers[control] = (function(controlType){
		 	return {
		 		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
		 			easyuiMapping.createComponent(element, valueAccessor, allBindings, viewModel, bindingContext,controlType).init();
		 		},update:function(element, valueAccessor, allBindings, viewModel, bindingContext) {
		 			easyuiMapping.getCachedComponent(element).update();
		 		}
		 	};
		 })(control);
	}       
})(jQuery);