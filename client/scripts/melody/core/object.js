/*
 * This file is part of Dorado 7.x (http://dorado7.bsdn.org).
 * 
 * Copyright (c) 2002-2012 BSTEK Corp. All rights reserved.
 * 
 * This file is dual-licensed under the AGPLv3 (http://www.gnu.org/licenses/agpl-3.0.html) 
 * and BSDN commercial (http://www.bsdn.org/licenses) licenses.
 * 
 * If you are unsure which license is appropriate for your use, please contact the sales department
 * at http://www.bstek.com/contact.
 */

(function() {
	
	//���������������
	var CLASS_REPOSITORY = {};
	var UNNAMED_CLASS = "#UnnamedClass";
	
	//���һ���µ�����
	function newClassName(prefix) {
		var i = 1;
		while (CLASS_REPOSITORY[prefix + i]) 
			i++;
		return prefix + i;
	}
	
	//�ѹ�ʱ
	function adapterFunction(fn) {
		var adapter = function() {
			return fn.apply(this, arguments);
		};
		adapter._doradoAdapter = true;
		return adapter;
	}
	//��¡��������
	function cloneDefintions(defs) {
		var newDefs = {};
		for (var p in defs) {
			if (defs.hasOwnProperty(p)) {
				newDefs[p] = dorado.Object.apply({}, defs[p]);
			}
		}
		return newDefs;
	}
	
	function overrideDefintions(subClass, defProp, defs, overwrite) {
		if (!defs) return;
		var sdefs = subClass.prototype[defProp];
		if (!sdefs) {
			subClass.prototype[defProp] = cloneDefintions(defs);
		} else {
			for (var p in defs) {
				if (defs.hasOwnProperty(p)) {
					var odef = defs[p];
					if (odef === undefined) return;
					var cdef = sdefs[p];
					if (cdef === undefined) sdefs[p] = cdef = {};
					for (var m in odef) {
						if (odef.hasOwnProperty(m) && (overwrite || cdef[m] === undefined)) {
							var odefv = odef[m];
							if (typeof odefv == "function") {
								// if (odefv.declaringClass) odefv = adapterFunction(odefv);
								if (!odefv.declaringClass) {
									odefv.declaringClass = subClass;
									odefv.methodName = m;
									odefv.definitionType = defProp;
									odefv.definitionName = p;
								}
							}
							cdef[m] = odefv;
						}
					}
				}
			}
		}
	}
	
	function override(subClass, overrides, overwrite) {
		if (!overrides) return;
		if (overwrite === undefined) overwrite = true;
		
		var subp = subClass.prototype;
		for (var p in overrides) {
			var override = overrides[p];
			if (p == "ATTRIBUTES" || p == "EVENTS") {
				overrideDefintions(subClass, p, override, overwrite);
				continue;
			}
			/*
			 // for debug
			 if (!overwrite && subp[p] !== undefined && overrides[p] !== undefined && subp[p] != overrides[p]) {
			 window._skipedOverWriting = (window._skipedOverWriting || 0) + 1;
			 if (window._skipedOverWriting < 10) alert(subClass.className + ",  " + p + ",  " + overrides.constructor.className + "\n=============\n" + subp[p] + "\n=============\n" + overrides[p]);
			 }
			 */
			if (subp[p] === undefined || overwrite) {
				if (typeof override == "function") {
					// if (override.declaringClass) override = adapterFunction(override);
					if (!override.declaringClass) {
						override.declaringClass = subClass;
						override.methodName = p;
					}
				}
				subp[p] = override;
			}
		}
	};
	
	/**
	 * @author Benny Bao (mailto:benny.bao@bstek.com)
	 * @class ���ڷ�װһЩ����������ࡣ
	 * @static
	 */
	dorado.Object = {
	
		/**
		 * ����һ�������ռ䡣
		 * @param {String} name �����ռ�����ơ�����"dorado.sample"��
		 * @see $namespace
		 *
		 * @example
		 * // �����µ���Ϊ"dorado.sample"�������ռ䡣
		 * dorado.Object.createNamespace("dorado.sample");
		 *
		 * // ʹ���´����������ռ䡣
		 * dorado.sample.MyClass = function() {
		 * };
		 */
		createNamespace: function(name) {
			var names = name.split('.');
			var parent = window;
			for (var i = 0; i < names.length; i++) {
				var n = names[i];
				var p = parent[n];
				if (p === undefined) {
					parent[n] = p = {};
				}
				parent = p;
			}
			return parent;
		},
		
		/**
		 * ����������һ���µ��ࡣ
		 * @param {Object} p �����prototype�� �ڸò������������������м������ر�ע�⣺
		 * <ul>
		 * <li>constructor - ��������Ĺ��췽�������ô����������塣</li>
		 * <li>$className - ������ơ������Ʋ���������ִ���߼����Ӱ�죬���Ƕ���һ����Ч�����ƶ���JavaScript�ĵ��Խ��к���Ҫ�����塣 </li>
		 * </ul>
		 * @return {Object} �µ��ࡣ
		 * @see $class
		 *
		 * @example
		 * var MyClass = dorado.Object.createClass( {
		 * 	$className : "MyClass",
		 *
		 * 	// ���췽��
		 * 	constructor : function(message) {
		 * 		this.message = message;
		 * 	},
		 * 	getMessage : function() {
		 * 		return this.message;
		 * 	}
		 * });
		 * var foo = new Foo("Hello world!");
		 * alert(foo.getMessage()); // should say "Hello world!"
		 */
		createClass: function(p) {
			var constr = p.constructor;
			if (constr === Object) constr = new Function();
			constr.className = p.$className || newClassName(UNNAMED_CLASS);
			delete p.$className;
			
			for (var m in p) {
				if (p.hasOwnProperty(m)) {
					var v = p[m];
					if (typeof v == "function") {
						// if (v.declaringClass) p[m] = v = adapterFunction(v);
						if (!v.declaringClass) {
							v.declaringClass = constr;
							v.methodName = m;
						}
					}
				}
			}
			
			constr.prototype = p;
			CLASS_REPOSITORY[constr.className] = constr;
			return constr;
		},
		
		/**
		 * ��һ���������е��������Ժͷ�����д����һ�����С�
		 * @function
		 * @param {Object} subClass ����д���ࡣ
		 * @param {Object} overrides ����Ҫ��д�����Ժͷ�����������
		 * @param {boolean} [overwrite=true] �Ƿ�������subClass���Ѵ��ڵ�ͬ�����Ի򷽷���Ĭ��Ϊ�������ǡ�
		 */
		override: override,
		
		/**
		 * ��ָ���ĸ���������һ���µ����ࡣ
		 * <p>
		 * ͨ���˷����̳г�������������µ���չ���ԣ�
		 * <ul>
		 * <li>superClass - {Prototype} ��һ�����ࡣ</li>
		 * <li>superClasses - {Prototype[]} ���и�������顣</li>
		 * </ul>
		 * �������Եľ����÷���μ�ʾ����
		 * </p>
		 * @function
		 * @param {Prototype|Prototype[]} superClass �����������顣
		 * ����˴������˶�����࣬��ôdorado���������еĵ�һ��������Ϊ��Ҫ�ĸ��࣬�����superClass���Խ�ָ���һ�����ࡣ
		 * ���������������Ժͷ��������̳е������У��Һ��游���еķ��������Բ��Ḳ��ǰ���ͬ�����������ԡ�
		 * @param {Object} [overrides] ����һЩ���Ժͷ�������������Щ���Ժͷ���������д�������ɵ����ࡣ �ڸò������������������м������ر�ע�⣺
		 * <ul>
		 * <li>constructor - ��������Ĺ��췽�������ô����������塣</li>
		 * <li>$className -
		 * ������ơ������Ʋ���������ִ���߼����Ӱ�죬���Ƕ���һ����Ч�����ƶ���JavaScript�ĵ��Խ��к���Ҫ�����塣 </li>
		 * </ul>
		 * @return {Prototype} �µ����ࡣ
		 *
		 * @see $extend
		 *
		 * @example
		 * // ��SuperClass�������õ�MyClass��
		 * var MyClass = dorado.Object.extend(SuperClass, {
		 * 	$className : "MyClass",
		 * 	//constructor��һ������ķ���������������Ĺ��췽����
		 * 	constructor : function() {
		 * 		//���ø���Ĺ��췽����
		 * 		SubClass.superClass.constructor.call(this, arguments);
		 * 		this.children = [];
		 * },
		 *
		 * // ����һ���������еķ�����
		 * 	getChildren : function() {
		 * 		return this.children;
		 * 	}
		 * });
		 */
		extend: (function() {
			var oc = Object.prototype.constructor;
			return function(superClass, overrides) {
				var sc, scs;
				if (superClass instanceof Array) {
					scs = superClass;
					sc = superClass[0];
				} else {
					sc = superClass;
				}
				
				var subClass = (overrides && overrides.constructor != oc) ? overrides.constructor : function() {
					sc.apply(this, arguments);
				};
				
				var fn = new Function();
				var sp = fn.prototype = sc.prototype;
				
				// ��ĳ���಻��ͨ��dorado�ķ���������ʱ��ȷ�����ܹ�����dorado�Ļ����淶��
				if (!sc.className) {
					sp.constructor = sc;
					sc.className = newClassName(UNNAMED_CLASS);
					sc.declaringClass = sp;
					sc.methodName = "constructor";
				}
				
				var subp = subClass.prototype = new fn();
				subp.constructor = subClass;
				subClass.className = overrides.$className || newClassName((sc.$className || UNNAMED_CLASS) + '$');
				subClass.superClass = sc;
				subClass.declaringClass = subClass;
				subClass.methodName = "constructor";
				
				delete overrides.$className;
				delete overrides.constructor;
				
				// process attributes, dirty code
				var attrs = subp["ATTRIBUTES"];
				if (attrs) {
					subp["ATTRIBUTES"] = cloneDefintions(attrs);
				}
				
				// process avents, dirty code
				var events = subp["EVENTS"];
				if (events) {
					subp["EVENTS"] = cloneDefintions(events);
				}
				
				var ps = [sc];
				if (scs) {
					for (var i = 1, p; i < scs.length; i++) {
						p = scs[i].prototype;
						override(subClass, p, false);
						ps.push(scs[i]);
					}
				}
				subClass.superClasses = ps;
				
				override(subClass, overrides, true);
				
				CLASS_REPOSITORY[subClass.className] = subClass;
				return subClass;
			};
		})(),
		
		/**
		 * �������������ÿһ�����ԡ�
		 * @param {Object} object Ҫ�����Ķ���
		 * @param {Function} fn ���ڼ���ÿһ�����Եĵ���������<br>
		 * �÷���������������������
		 * <ul>
		 * <li>p - {String} ��ǰ��������������</li>
		 * <li>v - {Object} ��ǰ����������ֵ�� </li>
		 * </ul>
		 * �÷����е�this����Ϊ�������Ķ���
		 */
		eachProperty: function(object, fn) {
			if (object && fn) {
				for (var p in object) 
					fn.call(object, p, object[p]);
			}
		},
		
		/**
		 * ��Դ���������е����Ը��ƣ����ǣ���Ŀ������С�
		 * @param {Object} target Ŀ�����
		 * @param {Object} source Դ����
		 * @param {boolean|Function} [options] ѡ�
		 * �˲��������������ֶ��巽ʽ��
		 * <ul>
		 * <li>��ֵ���������߼�ֵʱ����ʾ�Ƿ񸲸�Ŀ�������ԭ�е�����ֵ��
		 * ������ô˲���Ϊfalse����ôֻ�е�Ŀ�����ԭ�е�����ֵδ�����ֵΪundefinedʱ���Ž�Դ�����е�����ֵд��Ŀ�����
		 * ����������ѡ����ϵͳĬ�ϰ��ո��Ƿ�ʽ����</li>
		 * <li>��ֵ��������Functionʱ����ʾ���ڼ���ÿһ�����Եĸ�ֵ���������ط�����</li>
		 * </ul>
		 * @return {Object} ����Ŀ�����
		 *
		 * @example
		 * // p, v��������ǰ���ڴ����������������ֵ��
		 * function listener(p, v) {
		 * 	if (p == "prop2") {
		 * 		this[p] = v * 2; // this��apply������target��������
		 * 		return false; // ����false��ʾ֪ͨapply���������Դ����Եĺ�������
		 * 	}
		 * 	else if (p == "prop3") {
		 * 		return false; // ����false��ʾ֪ͨapply���������Դ����Եĺ�������
		 * 	}
		 * }
		 *
		 * var target = {};
		 * var source = {
		 * 	prop1 : 100,
		 * 	prop2 : 200,
		 * 	prop3 : 300
		 * };
		 * dorado.Object.apply(target, source, listener);
		 * //��ʱ��targetӦΪ { prop1: 100, prop2: 400 }
		 */
		apply: function(target, source, options) {
			if (source) {
				for (var p in source) {
					if (typeof options == "function" && options.call(target, p, source[p]) === false) continue;
					if (options === false && target[p] !== undefined) continue;
					target[p] = source[p];
				}
			}
			return target;
		},
		
		/**
		 * �ж�һ������ʵ���Ƿ�ĳ���ӿڵ�ʵ����
		 * <p>
		 * �ṩ�˷�����ԭ������Ϊdorado�Ķ��󼯳ɻ�����֧�ֶ��ؼ̳еģ�
		 * ��Javascript��ԭ����instanceof������ֻ��֧�ֶԶ��ؼ̳��е�һ�������͵��жϡ�
		 * ��ˣ���������Ҫ�ж϶��ؼ̳��еĺ󼸸�������ʱ������ʹ�ô˷�����<br>
		 * ��Ҫע�����instanceof������������Ч��Զ���ڴ˷�����
		 * </p>
		 * @param {Object} object Ҫ�жϵĶ���ʵ����
		 * @param {Function} type ���ӿڡ�ע�⣺�˴�����ĳ����ӿڱ�����ͨ��dorado����ġ�
		 * @return {boolean} �Ƿ��Ǹ������ӿڵ�ʵ����
		 */
		isInstanceOf: function(object, type) {
		
			function hasSuperClass(superClasses) {
				if (!superClasses) return false;
				if (superClasses.indexOf(type) >= 0) return true;
				for (var i = 0; i < superClasses.length; i++) {
					if (hasSuperClass(superClasses[i].superClasses)) return true;
				}
				return false;
			}
			
			if (!object) return false;
			var b = false;
			if (type.className) eval("b = object instanceof " + type.className);
			if (!b) {
				var t = object.constructor;
				if (t) b = hasSuperClass(t.superClasses);
			}
			return b;
		},
		
		/**
		 * ��һ���������ǳ�ȿ�¡��
		 * @param {Object} object Ҫ��¡�Ķ���
		 * @param {Object} [options] ִ��ѡ�
		 * @param {Function} [options.onCreate] ���ڴ�����¡����Ļص�������
		 * @param {Function} [options.onCopyProperty] ��������ÿһ�����Ը��ƵĻص�������
		 * @return {Object} �µĿ�¡����
		 */
		clone: function(object, options) {
			if (typeof object == "object") {
				var objClone, options = options || {};
				if (options.onCreate) objClone = new options.onCreate(object);
				else objClone = new object.constructor();
				for (var p in object) {
					if (!options.onCopyProperty || options.onCopyProperty(p, object, objClone)) {
						objClone[p] = object[p];
					}
				}
				objClone.toString = object.toString;
				objClone.valueOf = object.valueOf;
				return objClone;
			} else {
				return object;
			}
		},
		
		hashCode: function(object) {
			if (object == null) return 0;
			
			var strKey = (typeof object) + '|' + dorado.JSON.stringify(object), hash = 0;
			for (i = 0; i < strKey.length; i++) {
				var c = strKey.charCodeAt(i);
				hash = ((hash << 5) - hash) + c;
				hash = hash & hash; // Convert to 32bit integer
			}
			return hash;
		}
		
	};
	
	/**
	 * @name $namespace
	 * @function
	 * @description dorado.Object.createNamespace()�����Ŀ�ݷ�ʽ��
	 * ��ϸ�÷���ο�dorado.Object.createNamespace()��˵����
	 * @see dorado.Object.createNamespace
	 *
	 * @example
	 * // �����µ���Ϊ"dorado.sample"�������ռ䡣
	 * $namespace("dorado.sample");
	 *
	 * // ʹ���´����������ռ䡣
	 * dorado.sample.MyClass = function() {
	 * };
	 */
	window.$namespace = dorado.Object.createNamespace;
	
	/**
	 * @name $class
	 * @function
	 * @description dorado.Object.createClass()�����Ŀ�ݷ�ʽ��
	 * ��ϸ�÷���ο�dorado.Object.createClass()��˵����
	 * @see dorado.Object.createClass
	 *
	 * @example
	 * var MyClass = $class("MyClass"�� {
	 * 		// ���췽��
	 * 		constructor: function(message) {
	 * 			this.message = message;
	 * 		},
	 * 		getMessage: function() {
	 * 			return this.message;
	 * 		}
	 * 	});
	 * var foo = new Foo("Hello world!");
	 * alert(foo.getMessage());	// should say "Hello world!";
	 */
	window.$class = dorado.Object.createClass;
	
	/**
	 * @name $extend
	 * @function
	 * @description dorado.Object.extend()�����Ŀ�ݷ�ʽ��
	 * ��ϸ�÷���ο�dorado.Object.extend()��˵����
	 * @see dorado.Object.extend
	 *
	 * @example
	 * // ��SuperClass�������õ�MyClass��
	 * var MyClass = $extend("MyClass", SuperClass, {
	 * 	// constructor��һ������ķ���������������Ĺ��췽����
	 * 	constructor : function() {
	 * 		// ���ø���Ĺ��췽����
	 * 		SubClass.superClass.constructor.call(this, arguments);
	 * 		this.children = [];
	 * 	},
	 *
	 * 	// ����һ���������еķ�����
	 * 	getChildren : function() {
	 * 		return this.children;
	 * 	}
	 * });
	 */
	window.$extend = dorado.Object.extend;
	
	/**
	 * @name $getSuperClass
	 * @function
	 * @description ���ص�ǰ����ĳ��ࡣ���ڶ��ؼ̳ж��ԣ��˷������ص�һ�����ࡣ
	 * <p>
	 * ע�⣺�˷����ĵ��ñ�������෽���ڲ�����Ч��
	 * </p>
	 * @return {Function} ���ࡣ
	 */
	var getSuperClass = window.$getSuperClass = function() {
		var fn = getSuperClass.caller, superClass;
		if (fn.declaringClass) superClass = fn.declaringClass.superClass;
		return superClass || {};
	};
	
	/**
	 * @name $getSuperClasses
	 * @function
	 * @description ���ص�ǰ����ĳ�������顣
	 * <p>
	 * ע�⣺�˷����ĵ��ñ�������෽���ڲ�����Ч��
	 * </p>
	 * @return {Prototype[]} ��������顣
	 */
	var getSuperClasses = window.$getSuperClasses = function() {
		var fn = getSuperClasses.caller, superClass;
		if (dorado.Browser.opera && dorado.Browser.version < 10) fn = fn.caller;
		if (fn.caller && fn.caller._doradoAdapter) fn = fn.caller;
		
		if (fn.declaringClass) superClasses = fn.declaringClass.superClasses;
		return superClasses || [];
	};
	
	/**
	 * @name $invokeSuper
	 * @function
	 * @description ���õ�ǰ�����ڳ����е�ʵ���߼���
	 * <p>
	 * ע��˷����ĵ��ñ�������෽���ڲ�����Ч��<br>
	 * ���⣬�˷�������ͨ��call�﷨���е��ã���ʾ����
	 * </p>
	 * @param {Object} scope ���ó��෽��ʱ����������һ��Ӧֱ�Ӵ���this��
	 * @param {Object[]} [args] ���ó��෽��ʱ�Ĳ������顣�ܶ���������ǿ���ֱ�Ӵ���arguments��
	 *
	 * @example
	 * $invokeSuper.call(this, arguments); // �ϼ򵥵ĵ��÷�ʽ
	 * $invokeSuper.call(this, [ "Sample Arg", true ]); // �Զ��崫�����෽���Ĳ�������
	 */
	var invokeSuper = window.$invokeSuper = function(args) {
		var fn = invokeSuper.caller;
		if (dorado.Browser.opera && dorado.Browser.version < 10) fn = fn.caller;
		if (fn.caller && fn.caller._doradoAdapter) fn = fn.caller;
		
		if (fn.declaringClass) {
			var superClasses = fn.declaringClass.superClasses;
			if (!superClasses) return;
			
			for (var i = 0; i < superClasses.length; i++) {
				var superClass = superClasses[i].prototype;
				var superFn;
				if (fn.definitionType) {
					superFn = superClass[fn.definitionType][fn.definitionName][fn.methodName];
				} else {
					superFn = superClass[fn.methodName];
				}
				if (superFn) {
					return superFn.apply(this, args || []);
				}
			}
		}
	};
	invokeSuper.methodName = "$invokeSuper";
	
})();
