import { UROVEN_KOOP_1 } from '../src/level/urovni/koop-1';
import { proveritUroven } from '../src/level/validator';

const o = proveritUroven(UROVEN_KOOP_1);
console.log(o.length ? `валидатор: ${o.join('; ')}` : 'валидатор: чисто');
