
export default class Test {

	constructor( name ) {
		this.name = this.pad_left(name, ' ', 20);
		this.tests = [];
		this.cumulative = [];
	}

	test( val, name = false ) {
		this.tests.push({ val, name });
	}

	add( val ) {
		this.cumulative.push( val );
	}

	get() {
		return this.cumulative.join('/');
	}

	clear() {
		this.cumulative = [];
	}

	results() {
		let passed = this.tests.filter( function( value ) { return value.val === true; } ).length,
			failed = this.tests.filter( function( value ) { return value.val === false; } ).length,
			record = '';
			for ( let test of this.tests ) {
				record += ( test.name ? test.name+':' : '' ) + ( test.val === true ? '1 ' : '0 ' );
			}

		return( 'test ' + this.name + ': '+"\t"+'passed = ' + passed + ' / ' + this.tests.length + ', '+"\t"+'failed = ' + failed + ' / ' + this.tests.length + ( failed > 0 ? ', record: ' + record : '' ) );
	}

    pad_left( s, c, n ) {
        if ( typeof s !== 'string' ) { s = String(s); }
        return ( c.repeat( ( n - s.length ) > 0 ? ( n - s.length ) : 0 ) + s );
    }
}